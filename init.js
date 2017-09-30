require('dotenv').config()

const Client = require('bitcoin-core');
const client = new Client({
  username: process.env.rpcuser,
  password: process.env.rpcpassword,
  port: process.env.rpcport,
  host: process.env.rpchost
});
client.command({ method: 'getnewaddress', parameters: ['faucet'] }).then((res) => {
	console.log(res)
})
client.getBalance((err, balance)=> {
	console.log(`balance ${balance}`)
})