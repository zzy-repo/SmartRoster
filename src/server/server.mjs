import express from 'express'
import cors from 'cors'

const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Hello from SmartRoster API!' })
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})