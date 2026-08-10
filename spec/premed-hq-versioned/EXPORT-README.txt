Premed OS Dashboard

Open index.html in a browser for the dashboard.

For Google Drive backup/OAuth, serve the folder from a local or hosted http(s)
origin instead of opening index.html as file://. A quick local command is:

python3 -m http.server 8000

Then open:

http://127.0.0.1:8000/index.html

Core data autosaves in your browser localStorage. Use Settings & Backup inside
the app to export/import JSON backups.
