**The app is deployed in Render with the link:** https://encrypto-hvrx.onrender.com
Clicking the link will automatically launch the app.



To start: node index.js
We can communicate with two users from different PC's or phone by giving the ip address in .env file(The ip address should be of your PC).
But they should be on the same Wi-Fi network.

You will get the ip address of your pc by typing ipconfig in command prompt or terminal.

--------------------------------

# Encrypto

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
   API_PORT=5000

   API_HOST=0.0.0.0

   MONGO_URI=mongodb+srv://mandarrai:mandarrai10@cluster0.udiee.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

   TOKEN_KEY=random_string
    ```

- Run npm run dev to launch the server (index.js).
- The script automatically restarts with `nodemon` whenever a file is modified.
- Messages like `Server is running on http://0.0.0.0:5000` and 'Successfully connected to database' confirm the server started successfully.

## Authors

- [@mandarrai10](https://github.com/mandarrai10)

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
