"""Riordino delle cartelle di Know_Tool (piano: 00_Control/specifiche/piano_riordino_cartelle.md).
Si lancia dalla radice del repo:  python riordina_cartelle.py [--prova]
Con --prova mostra solo cosa farebbe. Fa: estrae il pacchetto del codice, 10 spostamenti con git mv, commit."""
import subprocess, sys, tarfile, os, shutil

PROVA = '--prova' in sys.argv
B = '01_Argomenti'
MOSSE = [
    ('informatica', 'Informatica'),
    ('Informatica/reti', 'Informatica/Reti'),
    ('Informatica/Reti/MikroTik per situazioni', 'Informatica/Reti/MikroTik/MikroTik per situazioni'),
    ('italiano', 'Italiano'),
    ('Italiano/autori', 'Italiano/Autori'),
    ('Italiano/fonti', 'Italiano/Fonti'),
    ('TPSIT/MSP/appunti', 'TPSIT/MSP/Appunti'),
    ('TPSIT/MSP/fonti', 'TPSIT/MSP/Fonti'),
    ('TPSIT/MSP/pratica', 'TPSIT/MSP/Pratica'),
    ('TPSIT/MSP/schemi', 'TPSIT/MSP/Schemi'),
]

def git(*a):
    print('git', *a)
    if not PROVA:
        subprocess.run(['git', *a], check=True)

def esiste(rel):
    # elenca davvero le cartelle: su Windows os.path.exists non distingue le maiuscole
    p = os.path.join(B, *rel.split('/')[:-1]) if '/' in rel else B
    return os.path.isdir(p) and rel.split('/')[-1] in os.listdir(p)

if not os.path.isdir('.git') or not os.path.isdir(B):
    sys.exit('Lancialo dalla radice di Know_Tool.')
pack = '99_Archivio/riordino_codice_pack.tgz'
if os.path.exists(pack):
    print('estraggo', pack)
    if not PROVA:
        tarfile.open(pack).extractall('.')
for da, a in MOSSE:
    if not esiste(da):
        print('salto (già fatto o assente):', da)
        continue
    d, n = f'{B}/{da}', f'{B}/{a}'
    if da.lower() == a.lower() or os.path.dirname(da) == os.path.dirname(a) and da.lower() == a.lower():
        tmp = d + '__tmp'
        git('mv', d, tmp)
        git('mv', tmp, n)
    else:
        os.makedirs(os.path.dirname(n), exist_ok=True) if not PROVA else None
        git('mv', d, n)
git('add', '-A', '02_App', B)
git('commit', '-m', 'Riordino cartelle: Materia/Argomento con nomi maiuscoli\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01DnQWXrocmiHQQhXFa32pbQ')
print('fatto')
