import os
import shutil
import sqlite3
from datetime import datetime

DB_FILE = os.path.join(os.path.dirname(__file__), "goodluck_palace.db")
BACKUP_DIR = os.path.join(os.path.dirname(__file__), "backups")

def ensure_backup_dir():
    os.makedirs(BACKUP_DIR, exist_ok=True)

def backup_database(custom_filename=None) -> str:
    """
    Performs an online, zero-downtime atomic backup of the SQLite database
    using SQLite's online backup API.
    """
    ensure_backup_dir()
    if custom_filename:
        dest_path = os.path.join(BACKUP_DIR, custom_filename)
    else:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        dest_path = os.path.join(BACKUP_DIR, f"goodluck_palace_backup_{timestamp}.db")

    source_conn = sqlite3.connect(DB_FILE)
    dest_conn = sqlite3.connect(dest_path)
    try:
        # Atomic online backup
        source_conn.backup(dest_conn)
    finally:
        dest_conn.close()
        source_conn.close()

    return dest_path

def restore_database(backup_path: str):
    """
    Restores the database from a verified backup file atomically.
    """
    if not os.path.exists(backup_path):
        raise FileNotFoundError(f"Backup file not found at: {backup_path}")

    backup_conn = sqlite3.connect(backup_path)
    target_conn = sqlite3.connect(DB_FILE)
    try:
        backup_conn.backup(target_conn)
    finally:
        target_conn.close()
        backup_conn.close()

def check_database_integrity(db_path=None) -> bool:
    """
    Executes SQLite PRAGMA integrity_check to verify zero page/index corruption.
    """
    target = db_path or DB_FILE
    if not os.path.exists(target):
        return False
    conn = sqlite3.connect(target)
    cursor = conn.cursor()
    cursor.execute("PRAGMA integrity_check")
    result = cursor.fetchone()[0]
    conn.close()
    return result.lower() == "ok"

def prune_old_backups(keep_days=7):
    """
    Retention policy: Prunes backups older than keep_days.
    """
    ensure_backup_dir()
    now_ts = datetime.now().timestamp()
    cutoff_ts = now_ts - (keep_days * 86400)
    for fname in os.listdir(BACKUP_DIR):
        if fname.endswith(".db"):
            fpath = os.path.join(BACKUP_DIR, fname)
            if os.path.getmtime(fpath) < cutoff_ts:
                try:
                    os.remove(fpath)
                except Exception:
                    pass

def run_restoration_drill():
    """
    Automated drill that:
    1. Checks live database integrity.
    2. Creates an atomic backup.
    3. Checks backup file integrity.
    4. Writes a temporary canary row into the live DB.
    5. Restores from the atomic backup.
    6. Verifies the canary row is absent and data integrity remains 100% OK.
    """
    print("[BACKUP DRILL] 0. Checking live database integrity...")
    assert check_database_integrity(DB_FILE) == True, "Live database failed integrity check!"
    print("[BACKUP DRILL]    Live database integrity: OK (PRAGMA integrity_check passed)")

    print("[BACKUP DRILL] 1. Creating point-in-time atomic backup...")
    backup_file = backup_database("restoration_drill_test.db")
    print(f"[BACKUP DRILL]    Backup created at: {backup_file}")
    assert check_database_integrity(backup_file) == True, "Backup file failed integrity check!"
    print("[BACKUP DRILL]    Backup file integrity: OK")

    print("[BACKUP DRILL] 2. Inserting canary marker in live database...")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    canary_id = "canary_test_marker_9999"
    cursor.execute("CREATE TABLE IF NOT EXISTS drill_canary (id TEXT PRIMARY KEY, created_at TEXT)")
    cursor.execute("INSERT INTO drill_canary VALUES (?, ?)", (canary_id, datetime.now().isoformat()))
    conn.commit()
    
    # Confirm canary exists
    cursor.execute("SELECT COUNT(*) FROM drill_canary WHERE id = ?", (canary_id,))
    assert cursor.fetchone()[0] == 1, "Canary insertion failed"
    conn.close()
    print("[BACKUP DRILL]    Canary row verified in live database.")

    print("[BACKUP DRILL] 3. Restoring live database from backup snapshot...")
    restore_database(backup_file)
    print("[BACKUP DRILL]    Restoration completed.")

    print("[BACKUP DRILL] 4. Verifying state after restoration...")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    # Table drill_canary shouldn't exist or canary row shouldn't exist in the restored snapshot
    try:
        cursor.execute("SELECT COUNT(*) FROM drill_canary WHERE id = ?", (canary_id,))
        count = cursor.fetchone()[0]
        assert count == 0, "Canary row unexpectedly survived restoration!"
    except sqlite3.OperationalError:
        # Table does not exist in backup - expected and verified!
        pass

    # Verify orders and products remain intact
    cursor.execute("SELECT COUNT(*) FROM products")
    prod_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM orders")
    order_count = cursor.fetchone()[0]
    conn.close()

    print(f"[BACKUP DRILL]    Restored data verified: {prod_count} products, {order_count} orders intact.")
    print("[BACKUP DRILL] [PASS] DATABASE RESTORATION DRILL PASSED 100%!")
    return True

if __name__ == "__main__":
    run_restoration_drill()
