# Application d\'Aide à la Tarification d\'Assurance IARD Entreprises

### Parcours de tarification

**Ecran 1 : Visualisation des Devis**

-   Affichage de la liste de tous les projets/devis établis présents en base de données.
    -   Tableau avec informations clés : numéro d’opportunité, nom du client, tarif proposé, etc.
    -   Liens pour télécharger les documents Word/PDF pour chaque devis.
    -   Fonctionnalités de filtrage et de tri sur le tableau.
-   Bouton « Nouveau devis » pour accéder à l’écran de création/modification.

**Ecran 2 : Création/Modification de Devis**

-   Saisie des informations du devis : numéro d’opportunité, nom du client, et autres champs spécifiés
-   Validation des données et génération de documents :
    -   `Proposition_commerciale_Num_opportunité_Date:Heure.pdf`
    -   `Proposition_commerciale_Num_opportunité_Date:Heure.docx`

### Précisions Techniques

1.  **Stack Technique Imposée/Suggérée :**
    -   Frontend : HTML/CSS/JavaScript (React a été choisi)
    -   Backend : NodeJS ou Python Django/Flask (Django a été choisi)
2.  **Base de Données :** Libre choix, simplicité d\'installation privilégiée (SQLite a été choisi).
3.  **Design :** Inspiration du design system AXA (www.axa.fr) (inspiration prise de https://www.axa.fr/assurance-auto/devis-tarifexpress.html)

Police d'écriture et autre aspect spécifique prise de [AXA Design System](https://designsystem.axa.com/design/typography).

Design System sur github (https://github.com/AxaFrance/design-system), Non utilisé dans le projet mais à des fins de références

## Fonctionnalités Implémentées

L\'application actuelle comprend les fonctionnalités suivantes :

### Gestion des Devis

-   **CRUD Complet :** Création, lecture, mise à jour et suppression des devis.
-   **Tableau de Bord des Devis :**
    -   Affichage clair et structuré de tous les devis existants.
    -   Informations affichées : N° Opportunité, Nom du Client, Type de Garantie, Destination de l\'Ouvrage, Type de Travaux, Tarif Proposé.
    -   **Tri dynamique** sur plusieurs colonnes.
    -   **Filtrage avancé** multicritères (numéro d\'opportunité, nom client, type de garantie, destination, type de travaux, fourchette de prix, présence d\'existant, client VIP, souhait RCMO).

### Formulaire de Devis Détaillé

-   Saisie et modification des informations du devis, incluant :
    -   Numéro d’opportunité (unique)
    -   Nom du client
    -   Type de garantie (DO seule, TRC seule, DUO)
    -   Destination de l’ouvrage (Habitation, Hors Habitation)
    -   Type de travaux (Neuf, Rénovation légère, Rénovation lourde)
    -   Coût de l’ouvrage
    -   Présence d’existant (Oui/Non)
    -   Client VIP (Oui/Non)
    -   Souhait RCMO (Oui/Non)
    -   Taux TRC et DO
    -   Description de l\'ouvrage
    -   Adresse du chantier
-   **Calcul automatique des primes :** `prime_seule_tarif_trc`, `prime_seule_tarif_do`, `prime_seule_tarif_duo` en fonction des taux et du coût de l\'ouvrage.
-   **Validation des données** en temps réel et à la soumission.
-   **Autocomplétion d\'adresse** pour le champ "Adresse du chantier" via l\'API [Adresse Data GOUV](https://adresse.data.gouv.fr/outils/api-doc/adresse).

### Génération et Téléchargement de Documents

-   Génération à la demande de propositions commerciales personnalisées aux formats **PDF** et **Microsoft Word (.docx)**.
-   Les documents incluent les détails du devis, les garanties, les franchises et sont formatés de manière professionnelle.
-   Nommage automatique des fichiers : `Proposition_commerciale_[Num_opportunité]_[Date]_[Heure].[pdf/docx]`.
-   Accès direct au téléchargement depuis le tableau des devis.

### Historique des Modifications

-   **Traçabilité complète :** Chaque création ou modification d\'un devis est enregistrée.
-   **Détails de l\'historique :**
    -   Champ modifié
    -   Ancienne et nouvelle valeur
    -   Date et heure de la modification
    -   Adresse IP de l\'utilisateur ayant effectué la modification.
-   **Visualisation facile :** Accès à l\'historique via un bouton sur chaque ligne du tableau des devis, affiché dans une modale dédiée.

## Technologies Utilisées

### Frontend

-   **React (v18+)** : Bibliothèque JavaScript pour la construction d\'interfaces utilisateur.
    -   Documentation : [https://react.dev/](https://react.dev/)
-   **React Router (v6+)** : Pour la gestion de la navigation et des routes côté client.
    -   Documentation : [https://reactrouter.com/](https://reactrouter.com/)
-   **Axios** : Client HTTP basé sur les promesses pour effectuer les appels API vers le backend.
    -   Documentation : [https://axios-http.com/](https://axios-http.com/)
-   **React Toastify** : Pour afficher des notifications (toasts) non bloquantes.
    -   Documentation : [https://fkhadra.github.io/react-toastify/](https://fkhadra.github.io/react-toastify/)
-   **React Icons** : Pour l\'intégration facile d\'icônes populaires.
    -   Documentation : [https://react-icons.github.io/react-icons/](https://react-icons.github.io/react-icons/)

### Backend

-   **Python (v3.11+)** : Langage de programmation principal pour le backend.
    -   Documentation : [https://www.python.org/doc/](https://www.python.org/doc/)
-   **Django (v5.2+)** : Framework web Python de haut niveau pour un développement rapide et propre.
    -   Documentation : [https://docs.djangoproject.com/](https://docs.djangoproject.com/)
-   **Django REST Framework (DRF)** : Boîte à outils puissante et flexible pour la création d\'API Web.
    -   Documentation : [https://www.django-rest-framework.org/](https://www.django-rest-framework.org/)
-   **`python-docx`** : Bibliothèque Python pour créer et mettre à jour des fichiers Microsoft Word (.docx).
    -   Documentation : [https://python-docx.readthedocs.io/](https://python-docx.readthedocs.io/)
-   **`ReportLab`** : Bibliothèque Python pour la création de documents PDF.
    -   Documentation : [https://www.reportlab.com/docs/reportlab-userguide.pdf](https://www.reportlab.com/docs/reportlab-userguide.pdf)

### Base de Données

-   **SQLite** : Moteur de base de données SQL auto-contenu, sans serveur, sans configuration.
    -   Documentation : [https://www.sqlite.org/docs.html](https://www.sqlite.org/docs.html)

## Installation et Lancement

### Prérequis

-   Node.js et npm (ou yarn)
-   Python 3.11+ et Pip

### Backend (Django)

1.  **Naviguer vers le dossier backend :**
    ```bash
    cd <nom_du_dossier_projet>/backend
    ```
2.  **Créer et activer un environnement virtuel :**
    ```powershell
    python -m venv env
    .\env\Scripts\Activate.ps1
    ```
3.  **Installer les dépendances Python :**
    ```powershell
    pip install -r requirements.txt
    ```
4.  **Effectuer les migrations de la base de données :**
    ```powershell
    cd axa_project
    python manage.py makemigrations django_api
    python manage.py migrate
    ```
    _Note: `django_api` est le nom de l\'application Django contenant les modèles. Adaptez si besoin._
5.  **Lancer le serveur de développement Django :**
    ```powershell
    python manage.py runserver
    ```
    Le backend sera généralement accessible sur `http://127.0.0.1:8000/`.

### Frontend (React)

1.  **Ouvrir un nouveau terminal et naviguer vers le dossier frontend :**
    ```powershell
    cd <nom_du_dossier_projet>/frontend
    ```
2.  **Installer les dépendances JavaScript :**
    ```powershell
    npm install
    # ou si vous utilisez yarn:
    # yarn install
    ```
3.  **Lancer l\'application React :**
    ```powershell
    npm start
    # ou si vous utilisez yarn:
    # yarn start
    ```
    Le frontend sera généralement accessible sur `http://localhost:3000/` et s\'ouvrira automatiquement dans votre navigateur. Si ce n'est pas sur le port 3000 il faudra aller dans backend/django_main/settings.py et changer dans CORS_ALLOWED_ORIGINS pour autoriser le front à acceder au back
