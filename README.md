# Current Progress!

**To start:** node index.js
We can communicate with two users from different PC's or phone by giving the ip address in .env file(The ip address shld be of your PC).
But the catch is that they shld be on the same Wi-Fi network.

You will get the ip address of ur pc by typing ipconfig in command prompt or terminal.

--------------------------------

# CiText

End-to-end encrypted instant messaging web application!

Group chats, end-to-end encryption and private messages.

## To launch the server

-Install MongoDB (Linux Ubuntu):

```shell
sudo apt get install mongo
# Verify whether everything works
mongo
> show dbs
```

- At the root of the project:

  - `npm init -y`
  - `npm install cors mongoose express jsonwebtoken dotenv bcryptjs cookie-parser ws socket.io crypto-js`
  - `npm install nodemon -D`
  - Modify the scripts section of `package.json` as follows:

    ```json
    "scripts": {
      "start": "node index.js",
      "dev": "nodemon index.js",
      "test": "echo \"Error: no test specified\" && exit 1"
    }
    ```

  - Create a `.env` file with the following values :

    ```env
    API_HOST=192.168.0.193
    API_PORT=8000
    SSL=false

    MONGO_URI= mongodb://localhost:27017/CiText

    TOKEN_KEY=random_string
    ```

- Run npm run dev to launch the server (index.js).
- The script automatically restarts with `nodemon` whenever a file is modified.
- Messages like `Listening on http://192.168.0.193:8000` and 'Successfully connected to database' confirm the server started successfully.

## Auteurs

- [@mandarrai10](https://github.com/mandarrai10n)

## 🚧 Areas for Improvement

### Server side

- [ ] Improve user status management (Online/Offline).
- [ ] Handle cases where the same user connects from multiple devices.
- [ ] Change the method of fetching chat messages (to manage a larger amount of data)
  - Fetch the last 50 messages for display.
  - When scrolling up, pause the scrollbar to load the next 50 messages.

### Client side

- [ ] Script `getMessages(idchat):` Make a `GET` API call to `/getAllMessages` with the chat ID in the request body.
- [ ] `selectContact():` Clear `messagesArray` and call `getMessages(idchat)` to refill it.
- [ ] Add icons for `Online` status and encrypted conversations.
- [ ] Optional button in the top-right corner of a contact.
- [ ] Add a button to delete a message or conversation.
