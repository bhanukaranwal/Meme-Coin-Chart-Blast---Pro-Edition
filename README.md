# Meme Coin Chart Blast - Pro Edition

A high-volatility, chart-based crash game inspired by meme crypto coins. Players select a meme coin, each with a unique risk profile, and bet on a rapidly rising chart. Cash out before the crash to win!

This project is built with HTML, Tailwind CSS, and JavaScript, using Tone.js for audio synthesis. It's a frontend-only application designed to simulate a "provably fair" crash game experience.

![Meme Coin Game Screenshot](https://placehold.co/600x400/1a1a2e/e0e0e0?text=Meme+Coin+Chart+Blast)

## Features

- **Multiple Meme Coins**: Choose between different coins (Doge, Shiba, Pepe), each with unique volatility and crash probabilities.
- **Dynamic Chart**: Smooth SVG-based chart animation.
- **Interactive UI**: Modern, responsive design with a "glassmorphism" aesthetic.
- **Sound Effects**: Synthesized sounds for betting, winning, and crashing using Tone.js.
- **Provably Fair Simulation**: Game outcomes are generated upfront from a seed, simulating a real-world provably fair system.

## Project Structure

/├── public/│   └── index.html      # Main HTML file├── src/│   ├── main.js         # Core game logic and interactivity│   └── styles.css      # Custom styles and Tailwind directives├── .gitignore          # Files to ignore for Git├── package.json        # Project dependencies and scripts└── README.md           # This file
## Setup and Installation

To run this project locally, you'll need [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd meme-coin-chart-blast
    ```

2.  **Install dependencies:**
    This project uses `tailwindcss` for styling.
    ```bash
    npm install
    ```

3.  **Run the development server:**
    We recommend using a simple live server to run the project. If you have VS Code, the "Live Server" extension is a great choice. Alternatively, you can use `npx`:
    ```bash
    npx live-server public
    ```
    This will open the game in your default web browser.

## How It Works

-   **Game Logic (`main.js`)**: Manages the game state (waiting, rising, crashed), player balance, betting, and outcome generation.
-   **Rendering (`index.html` & `main.js`)**: The UI is built with standard HTML elements. The chart is an SVG, dynamically drawn with JavaScript.
-   **Styling (`styles.css`)**: Uses Tailwind CSS for rapid UI development, with a few custom styles for animations and fonts.

## Contributing

Contributions are welcome! Please feel free to fork the repository, make changes, and submit a pull request.
