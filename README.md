# CiText

[![SchoolProject](https://img.shields.io/badge/School-project-83BD75?labelColor=B4E197&style=for-the-badge)]()
[![Javascript](https://img.shields.io/badge/Made%20with-Javascript-B22727?labelColor=EE5007&style=for-the-badge)]()
[![Socket](https://img.shields.io/badge/Uses-Socket.io-E4AEC5?labelColor=FFC4DD&style=for-the-badge)]()

Instant messaging web app with end-to-end encryption available at 🔗 [CiText.fr](https://CiText.fr).

Group chat, end-to-end encryption, private messages, and account management.

## Server Launch

- Install Mongo (Linux Ubuntu):
  
  ```shell
  sudo apt get install mongo
  # check that everything is working
  mongo
  > show dbs
  ```

- At the root of the project:
  - `npm init -y`
  - `npm install cors mongoose express jsonwebtoken dotenv bcryptjs cookie-parser ws socket.io crypto-js`
  - `npm install nodemon -D`
  - Modify the scripts in the package.json file as follows:
    
    ```json
    "scripts": {
      "start": "node index.js",
      "dev": "nodemon index.js",
      "test": "echo \"Error: no test specified\" && exit 1"
    }
    ```

  - Create a .env file with the following values:

    ```env
    API_PORT=8000
    API_HOST=localhost
    SSL=false

    MONGO_URI= mongodb://localhost:27017/CiText

    TOKEN_KEY=random_string
    ```

- Type `npm run dev` to start the server (index.js).
- The script will automatically refresh with `nodemon` on every file modification.
- The messages "Listening on `http://localhost:8000`" and "Successfully connected to database" confirm that the server has started successfully.

## Auteurs

* [@mandarrai10](https://github.com/mandarrai10)

## 🚧 Areas for Improvement

### Server Side

- [ ] Améliorer la gestion des statuts `En ligne` / `Hors ligne` des utilisateurs
- [ ] Gérer le cas de la double connexion pour un même utilisateur 
- [ ] Modifier la façon de récupérer les messages d'un chat (pour gérer un + grand nombre de données)
  - Requète pour fetch les 50 derniers messages pour les afficher
  - Si l'utilisateur remonte son chat, la scrollbar se bloque le temps de fetch les 50 prochains messages

### Côté client

- [ ] Script `getMessages(idchat)` pour un `GET` API sur `/getAllMessages` avec l'IdChat en body de requète
- [ ] `selectContact()`: clear le tableau `messagesArray` et appeler `getMessages(idchat)` pour le re-remplir
- [ ] Ajouter une icône pour le statut `En ligne` des contacts et les conversations chiffrées
- [ ] Bouton option en haut à droite du contact (?)
- [ ] Ajouter un bouton pour supprimer un message ou une conversation (?)
