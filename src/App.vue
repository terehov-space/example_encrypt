<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row>
          userinfo: {{ clientId }}
        </v-row>
        <v-row>
          <v-col>
            <v-btn @click="connect">Connect</v-btn>
          </v-col>
          <v-col>
            <v-btn @click="clients">Get Clients</v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-select :items="clientsList" item-title="publicKey" item-value="id" v-model="sendTo"/>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field v-model="sendText"/>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-btn @click="send" :disabled="!clientId || !sendTo">Send</v-btn>
          </v-col>
        </v-row>
        <v-row>
          <template v-for="message in messageList">
            <v-col cols="12" class="d-flex">
              <v-col cols="2">
                from: {{ message.from }}
              </v-col>
              <v-col cols="10">
                message: {{ message.text }}
              </v-col>
            </v-col>
          </template>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import {io} from "socket.io-client";
import {JSEncrypt} from "jsencrypt";

export default {
  name: 'App',

  data: () => ({
    client: null,
    sendTo: null,

    publicKey: null,
    privateKey: null,
    clientId: null,

    messageList: [],
    sendMessage: {},
    sendText: null,

    encryptTool: null,
    clientsList: [],
  }),

  mounted() {
    this.client = io('http://localhost:4000');

    this.client.on('privatekey', (args) => {
      this.privateKey = args
    })

    this.client.on('publickey', (args) => {
      this.publicKey = args
    })

    this.client.on('clientid', (args) => {
      this.clientId = args

      this.client.on(`${args}Clients`, (args) => {
        this.clientsList = args
      })

      this.client.on(`${args}Message`, (args) => {
        const encrypt = new JSEncrypt()
        encrypt.setPublicKey(this.privateKey)

        this.messageList.push({
          from: args.from,
          text: encrypt.decrypt(args.text)
        })
      })
    })
  },

  methods: {
    connect() {
      this.client.emit('getKey')
    },
    clients() {
      this.client.emit('getClients', {id: this.clientId})
    },
    send() {
      this.messageList.push({
        from: this.clientId,
        text: this.sendText,
      })

      const toKey = this.clientsList.find(item => item.id === this.sendTo)
      if (toKey) {
        const encrypt = new JSEncrypt()
        encrypt.setPublicKey(toKey.publicKey)

        this.client.emit('Message', {
          to: this.sendTo,
          from: this.clientId,
          text: encrypt.encrypt(this.sendText)
        })
      }
    }
  },

  watch: {
    sendTo(newVal, oldVal) {

    }
  }
}
</script>
