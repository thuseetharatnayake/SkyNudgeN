"""Create a URL-encoded password value without printing the input password."""
from getpass import getpass
from urllib.parse import quote

password = getpass("Supabase database password (input hidden): ")
print(quote(password, safe=""))