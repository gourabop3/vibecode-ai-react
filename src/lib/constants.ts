export const PROJECT_TEMPLATES = [
  {
    image: "/templates/netflix-template.avif",
    title: "Build a Netflix clone",
    prompt:
      "Build a modern Netflix-style homepage with a centered hero banner, movie sections with responsive card grids, and a modal for viewing details. Use dark mode with proper centering (min-h-screen flex items-center justify-center) and modern Tailwind styling. Include hover effects and smooth transitions.",
  },
  {
    image: "/templates/admin-panel-template.avif",
    title: "Build an admin dashboard",
    prompt:
      "Create a modern admin dashboard with proper centering and layout. Use min-h-screen bg-gray-50 with a centered container, sidebar navigation, stat cards with shadows, chart placeholders, and a responsive table. Include modern Tailwind styling with proper spacing, rounded corners, and hover effects.",
  },
  {
    image: "/templates/kanban-board-template.avif",
    title: "Build a kanban board",
    prompt:
      "Build a kanban board with drag-and-drop using react-beautiful-dnd and support for adding and removing tasks with local state. Use consistent spacing, column widths, and hover effects for a polished UI.",
  },
  {
    image: "/templates/file-manager-template.avif",
    title: "Build a file manager",
    prompt:
      "Build a file manager with folder list, file grid, and options to rename or delete items using mock data and local state. Focus on spacing, clear icons, and visual distinction between folders and files.",
  },
  {
    image: "/templates/youtube-clone-template.avif",
    title: "Build a YouTube clone",
    prompt:
      "Build a YouTube-style homepage with mock video thumbnails, a category sidebar, and a modal preview with title and description using local state. Ensure clean alignment and a well-organized grid layout.",
  },
  {
    image: "/templates/store-template.avif",
    title: "Build a store page",
    prompt:
      "Build a store page with category filters, a product grid, and local cart logic to add and remove items. Focus on clear typography, spacing, and button states for a great e-commerce UI.",
  },
  {
    image: "/templates/airbnb-clone-template.avif",
    title: "Build an Airbnb clone",
    prompt:
      "Build an Airbnb-style listings grid with mock data, filter sidebar, and a modal with property details using local state. Use card spacing, soft shadows, and clean layout for a welcoming design.",
  },
  {
    image: "/templates/spotify-template.avif",
    title: "Build a Spotify clone",
    prompt:
      "Build a Spotify-style music player with a sidebar for playlists, a main area for song details, and playback controls. Use local state for managing playback and song selection. Prioritize layout balance and intuitive control placement for a smooth user experience. Use dark mode.",
  }
] as const;