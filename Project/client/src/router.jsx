import {createBrowserRouter, createRoutesFromElements, Route, Outlet} from "react-router-dom";
import Box from '@mui/material/Box'
import Home from './pages/Home.jsx';
import Profile from './pages/Profile.jsx'
import AnimeDetails from './pages/AnimeDetails.jsx'
import Anime from './pages/Anime.jsx'
import SearchResults from './pages/Search.jsx'
import NotFound from './pages/NotFound.jsx'
import Navbar from "./components/Navbar.jsx"
import CategoryResults from "./pages/CategoryResults.jsx";
import Footer from "./components/Footer.jsx"


function Layout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box sx={{ flex: 1 }}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  )
}

export const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path="/" element={<Layout />}>
            <Route path="/" index element={<Home />} />
            <Route path="/Anime" element={<Anime />} />
            <Route path="/Anime/:slug" element={<AnimeDetails />} />
            <Route path="/Profile/:handle" element={<Profile />} />
            <Route path="/category/:type" element={<CategoryResults />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="*" element={<NotFound />} />
        </Route>
    )
)