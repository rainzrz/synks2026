import sqlite3

conn = sqlite3.connect('portal.db')
conn.execute('DELETE FROM cache')
conn.execute('DELETE FROM sessions')
conn.commit()
conn.close()
print('✅ Cache e sessões limpas!')