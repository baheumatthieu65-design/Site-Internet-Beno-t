# V17 — anti-flash dès index.html

Remplace entièrement :
- `index.html`
- `src/App.tsx`

Le navigateur affiche d'abord un voile neutre avant React.
App attend ensuite la configuration serveur et retire ce voile lorsque
la page est prête.

Ne colle pas les fichiers à la fin des anciens.
