import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import sql from './db/postgres.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://kyuu-list-client.vercel.app",
    "https://kyuu-list-client-myvxlotfl-kyuu-list.vercel.app"
  ],
  credentials: true
}))

app.use(express.json())

app.get('/', (req, res) => {
  res.send('API is running')
})

// Get all entries in users table
app.get('/users', async (req, res) => {
  try {
    const users = await sql`SELECT * FROM users`
    res.json(users)
  } catch (error) {
    console.error('Error fetching users:', {
      message: error.message,
      code: error.code
    })

    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// Fetch information regarding a specific user
app.get('/users/:handle', async (req, res) => {
  try {
    const [user] = await sql`
      SELECT 
        id,
        username,
        bio,
        handle,
        avatar                      
      FROM users                      
      WHERE handle = ${req.params.handle}`
    
    if(!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }
    return res.json(user)
  } catch (error) {
    console.error('Error fetching user:', {
      message: error.message,
      code: error.code
    })

    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// Add user to users table
app.post('/users', async (req, res) => {
  const {username, handle} = req.body
  if (!username || !handle) {
    return res.status(400).json({
      error: 'username and handle are required'
    })
  }
  try {
    const [user] = await sql`
    INSERT INTO users (username, handle)
    VALUES (${username}, ${handle})
    RETURNING id, username, handle`
    res.json(user)
  } catch (error){
    console.error(error)

    // handle duplicate key error (Postgres code 23505)
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Handle already exists'
      })
    }
    res.status(500).json({error: 'Failed to add user'})
  }
})

// Update user information in user table
app.patch('/users/:id', async (req, res) => {
  const { id } = req.params

  const {
    username = null,
    handle = null,
    avatar = null,
    bio = null
  } = req.body

  // Prevent completely empty updates
  if (
    username === null &&
    handle === null &&
    avatar === null &&
    bio === null
  ) {
    return res.status(400).json({
      error: 'At least one field must be provided'
    })
  }

  try {
    const [user] = await sql`
      UPDATE users
      SET
        username = COALESCE(${username}, username),
        handle = COALESCE(${handle}, handle),
        avatar = COALESCE(${avatar}, avatar),
        bio = COALESCE(${bio}, bio)
      WHERE id = ${id}
      RETURNING
        id,
        username,
        handle,
        avatar,
        bio
    `

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }

    return res.json(user)

  } catch (error) {
    console.error(error)

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Handle already exists'
      })
    }

    return res.status(500).json({
      error: 'Failed to update user'
    })
  }
})

// Delete user from users table
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params
  try {
    const [user] = await sql`
    DELETE FROM users
    WHERE id = ${id} 
    RETURNING id, username, handle`

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }

  } catch (error) {
    console.error(error)
    res.status(500).json({error: 'Failed to delete user'})
  }
})

// Get profile rankings for a specific user — now also returns position,
// sorted by position so the frontend doesn't need to re-sort on load.
// Rows with a null position (not yet manually ordered) sort to the end.
app.get('/profile_anime_ranks/:user_id', async (req, res) => {
  try {
    const list = await sql`
    SELECT 
      user_id,
      anime_id,
      rating,
      position
    FROM profile_anime_ranks
    WHERE user_id = ${req.params.user_id}
    ORDER BY position ASC NULLS LAST`
 
    if(list.length === 0) {
      return res.status(404).json({
        error: 'No anime ranks found for this user'
      })
    }
 
    return res.json(list)
 
  } catch (error) {
    console.error('Error fetching user:', {
      message: error.message,
      code: error.code
    })
 
    res.status(500).json({ error: 'Failed to fetch profile anime ranks' })
  }
})
 
// Create or update an anime ranking. position is optional — if omitted on
// a brand new rating, it defaults to "end of the list" (current max + 1)
// so newly-rated anime appear last until the user drags them somewhere else.
app.post('/profile_anime_ranks', async (req, res) => {
  try {
    const { user_id, anime_id, rating, position } = req.body
 
    if (!user_id || !anime_id || rating == null) {
      return res.status(400).json({
        error: 'user_id, anime_id, and rating are required'
      })
    }
 
    // If no explicit position was given, place this anime at the end of
    // the user's current top-rated list.
    let finalPosition = position
    if (finalPosition == null) {
      const [{ max_position }] = await sql`
        SELECT COALESCE(MAX(position), -1) AS max_position
        FROM profile_anime_ranks
        WHERE user_id = ${user_id}
      `
      finalPosition = max_position + 1
    }
 
    const result = await sql`
      INSERT INTO profile_anime_ranks (
        user_id,
        anime_id,
        rating,
        position
      )
      VALUES (
        ${user_id},
        ${anime_id},
        ${rating},
        ${finalPosition}
      )
      ON CONFLICT (user_id, anime_id)
      DO UPDATE SET
        rating = EXCLUDED.rating
      RETURNING *
    `
 
    return res.status(200).json(result[0])
 
  } catch (error) {
    console.error('Error upserting anime rank:', {
      message: error.message,
      code: error.code
    })
 
    return res.status(500).json({
      error: 'Failed to create anime rank'
    })
  }
})
 
// Update only the rating for an anime ranking (unchanged behavior, just
// now accepts decimal values since the column type changed)
app.patch('/profile_anime_ranks', async (req, res) => {
  try {
    const { user_id, anime_id, rating } = req.body
 
    if (!user_id || !anime_id || rating == null) {
      return res.status(400).json({
        error: 'user_id, anime_id, and rating are required'
      })
    }
 
    const result = await sql`
      UPDATE profile_anime_ranks
      SET rating = ${rating}
      WHERE user_id = ${user_id}
        AND anime_id = ${anime_id}
      RETURNING *
    `
 
    if (result.length === 0) {
      return res.status(404).json({
        error: 'Anime rank not found'
      })
    }
 
    return res.json(result[0])
 
  } catch (error) {
    console.error('Error updating anime rank:', {
      message: error.message,
      code: error.code
    })
 
    return res.status(500).json({
      error: 'Failed to update anime rank'
    })
  }
})
 
// NEW ROUTE — bulk-updates positions after a drag-and-drop reorder.
// Expects: { user_id, order: [anime_id, anime_id, ...] } where the array
// index becomes the new position (0 = first/top).
app.patch('/profile_anime_ranks/reorder', async (req, res) => {
  try {
    const { user_id, order } = req.body
 
    if (!user_id || !Array.isArray(order) || order.length === 0) {
      return res.status(400).json({
        error: 'user_id and a non-empty order array are required'
      })
    }
 
    // Run all position updates in a single transaction so a partial
    // failure can't leave the list in a half-reordered state.
    await sql.begin(async (tx) => {
      for (let i = 0; i < order.length; i++) {
        await tx`
          UPDATE profile_anime_ranks
          SET position = ${i}
          WHERE user_id = ${user_id}
            AND anime_id = ${order[i]}
        `
      }
    })
 
    return res.json({ message: 'Order updated successfully' })
 
  } catch (error) {
    console.error('Error reordering anime ranks:', {
      message: error.message,
      code: error.code
    })
 
    return res.status(500).json({
      error: 'Failed to reorder anime ranks'
    })
  }
})

// Delete an anime ranking
app.delete('/profile_anime_ranks', async (req, res) => {
  try {
    const { user_id, anime_id } = req.body

    if (!user_id || !anime_id) {
      return res.status(400).json({
        error: 'user_id and anime_id are required'
      })
    }

    const result = await sql`
      DELETE FROM profile_anime_ranks
      WHERE user_id = ${user_id}
        AND anime_id = ${anime_id}
      RETURNING *
    `

    if (result.length === 0) {
      return res.status(404).json({
        error: 'Anime rank not found'
      })
    }

    return res.json({
      message: 'Anime rank deleted successfully',
      deleted: result[0]
    })

  } catch (error) {
    console.error('Error deleting anime rank:', {
      message: error.message,
      code: error.code
    })

    return res.status(500).json({
      error: 'Failed to delete anime rank'
    })
  }
})

// Get user specific watch list
app.get('/user_watch_lists/:user_id', async (req, res) => {
  try {
    const list = await sql`
    SELECT 
      user_id,
      anime_id,
      status
    FROM user_watch_lists
    WHERE user_id = ${req.params.user_id}`

    if(list.length === 0) {
      return res.status(404).json({
        error: 'No watch list found for this user'
      })
    }

    return res.json(list)

  } catch (error) {
    console.error('Error fetching user:', {
      message: error.message,
      code: error.code
    })

    res.status(500).json({ error: 'Failed to fetch user_watch_lists' })
  }
  
})

// Inserts anime to a users watch list
app.post('/user_watch_lists', async (req, res) => {
  try {
    const { user_id, anime_id, status } = req.body

    if (!user_id || !anime_id || !status) {
      return res.status(400).json({
        error: 'user_id, anime_id, and status are required'
      })
    }

    const result = await sql`
      INSERT INTO user_watch_lists (
        user_id,
        anime_id,
        status
      )
      VALUES (
        ${user_id},
        ${anime_id},
        ${status}
      )
      ON CONFLICT (user_id, anime_id)
      DO UPDATE SET
        status = EXCLUDED.status
      RETURNING *
    `

    return res.status(200).json(result[0])

  } catch (error) {
    console.error('Error upserting watch list:', {
      message: error.message,
      code: error.code
    })

    return res.status(500).json({
      error: 'Failed to update user_watch_lists'
    })
  }
})

// Updates anime status from user_watch_lists table
app.patch('/user_watch_lists', async (req, res) => {
  try {
    const { user_id, anime_id, status } = req.body

    if (!user_id || !anime_id || !status) {
      return res.status(400).json({
        error: 'user_id, anime_id, and status are required'
      })
    }

    const result = await sql`
      UPDATE user_watch_lists
      SET status = ${status}
      WHERE user_id = ${user_id}
        AND anime_id = ${anime_id}
      RETURNING *
    `

    if (result.length === 0) {
      return res.status(404).json({
        error: 'Watch list entry not found'
      })
    }

    return res.json(result[0])

  } catch (error) {
    console.error('Error updating watch list status:', {
      message: error.message,
      code: error.code
    })

    return res.status(500).json({
      error: 'Failed to update watch list status'
    })
  }
})

// Removes anime from user_watch_lists table
app.delete('/user_watch_lists', async (req, res) => {
  try {
    const { user_id, anime_id } = req.body

    if (!user_id || !anime_id) {
      return res.status(400).json({
        error: 'user_id and anime_id are required'
      })
    }

    const result = await sql`
      DELETE FROM user_watch_lists
      WHERE user_id = ${user_id}
        AND anime_id = ${anime_id}
      RETURNING *
    `

    if (result.length === 0) {
      return res.status(404).json({
        error: 'Watch list entry not found'
      })
    }

    return res.json({
      message: 'Watch list entry deleted successfully',
      deleted: result[0]
    })

  } catch (error) {
    console.error('Error deleting watch list entry:', error)

    return res.status(500).json({
      error: 'Failed to delete watch list entry'
    })
  }
})

app.listen(PORT, () => {
  console.log(`App is running at http://localhost:${PORT}`)
})
