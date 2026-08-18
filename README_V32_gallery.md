# V32 — correction définitive de la galerie

Le problème venait de l'interaction entre l'éditeur visuel et la galerie
React de `JacketsShowcase`.

La galerie utilise désormais explicitement :
- `data-vce-gallery-main` pour la grande image ;
- `data-vce-gallery-thumbnail` pour les miniatures ;
- `data-vce-gallery-product-id` et `data-vce-gallery-index` pour identifier
  chaque image.

Résultat :
- cliquer une miniature continue de changer la grande image ;
- sélectionner une image dans l'éditeur est en lecture seule ;
- l'éditeur distingue grande image / miniature ;
- un remplacement depuis l'éditeur cible l'élément exact ;
- aucun remplacement ne modifie l'état React de la galerie au moment de la
  sélection ;
- la logique est compatible avec l'ajout de nouvelles images, car chaque
  miniature est identifiée par son index.

ZIP complet du projet, prêt à déposer sur GitHub.
