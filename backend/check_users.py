import sqlite3

conn = sqlite3.connect('portal.db')
c = conn.cursor()
c.execute('SELECT username, wiki_url FROM users')
print('Usuarios cadastrados:')
for row in c.fetchall():
    print(f'  Usuario: {row[0]}')
    print(f'  Wiki URL: {row[1]}')
    print()
conn.close()
