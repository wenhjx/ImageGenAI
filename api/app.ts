import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import authRoutes from './_routes/auth.js'
import generateRoutes from './_routes/generate.js'
import generationsRoutes from './_routes/generations.js'
import apiKeysRoutes from './_routes/api-keys.js'
import creditsRoutes from './_routes/credits.js'
import userRoutes from './_routes/user.js'

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/generate', generateRoutes)
app.use('/api/generations', generationsRoutes)
app.use('/api/api-keys', apiKeysRoutes)
app.use('/api/credits', creditsRoutes)
app.use('/api/user', userRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[App] Error handler:', error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
