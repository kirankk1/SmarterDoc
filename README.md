# SmarterDoc

SmarterDoc is a web-based application that allows users to upload `.docx` files, automatically detect variables within them, update the variables, and generate a PDF with the updated values.

## Features
- Upload `.docx` files.
- Automatically detect variables within the document.
- Edit detected variables through an interactive UI.
- Generate and download updated documents as PDFs.

## Technology Stack

### Backend
- **Node.js** with **Express** for server-side logic.
- **Multer** for file handling.
- **Mammoth** for parsing `.docx` files.
- **ConvertAPI** for PDF generation.
- **dotenv** for managing environment variables.
- Other dependencies: `axios`, `cors`, `form-data`, `nodemon`, and `path`.

### Frontend
- **React** for the user interface.
- **Axios** for API requests.

## Installation and Setup

### Prerequisites
- Node.js installed on your machine.
- ConvertAPI secret key.

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/kirankk1/SmarterDoc.git
   cd SmarterDoc
   ```

2. Set up the backend:
   ```bash
   cd api
   npm install
   ```

3. Set up the frontend:
   ```bash
   cd ../frontend
   npm install
   ```

4. Create an `.env` file in the root directory of the backend (`API`) and add the following:
   ```env
   CONVERTAPI_SECRET="your_convertapi_secret_key"
   ```

5. Start the backend server:
   ```bash
   cd api
   nodemon index.js
   ```

6. Start the frontend server:
   ```bash
   cd ../frontend
   npm run dev
   ```

## Usage
1. Navigate to the frontend interface in your browser.
2. Upload a `.docx` file.
3. Edit the detected variables using the provided input fields.
4. Generate the updated document as a downloadable PDF.

## Dependencies

### Backend Dependencies
- `axios`: ^1.7.9
- `convertapi`: ^1.15.0
- `cors`: ^2.8.5
- `dotenv`: ^16.4.7
- `express`: ^4.21.2
- `form-data`: ^4.0.1
- `mammoth`: ^1.8.0
- `multer`: ^1.4.5-lts.1
- `nodemon`: ^3.1.9
- `path`: ^0.12.7

### Frontend Dependencies
- `axios`: ^1.7.9
- `react`: ^18.3.1
- `react-dom`: ^18.3.1

## Contributing
Contributions are welcome! Please fork the repository and create a pull request.

## License
This project is licensed under the MIT License.

## Acknowledgments
- [ConvertAPI](https://www.convertapi.com/) for document conversion.
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js) for `.docx` parsing.

