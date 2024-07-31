const socket = io();
let currentPath = '/';
let currentFiles = [];
let currentIndex = 0;
let allFolders = [];
let startIndex = 0;
const foldersPerPage = 6;
let isFileView = false;
let pathHistory = [];
let allFoldersShown = false; // To track if all folders are displayed

// Function to display directory structure
const displayDirectory = (data) => {
  const { path, contents } = data;
  currentPath = path;
  allFolders = contents.filter(item => item.isDirectory);
  currentFiles = contents.filter(item => !item.isDirectory);

  if (allFolders.length === 0 && currentFiles.length > 0) {
    // No more folders, directly show the files
    isFileView = true;
    showFiles(currentFiles);
  } else {
    isFileView = false;
    showFolders(allFolders);
  }

  // Show or hide the "Go Back" button based on path history
  document.getElementById('back-button').style.display = pathHistory.length > 0 ? 'block' : 'none';
};

const showFolders = (folders) => {
  let foldersToShow = allFoldersShown ? folders : folders.slice(0, foldersPerPage);

  document.getElementById('directory').innerHTML = foldersToShow.map(folder =>
    `<div class="folder" data-name="${folder.name}">${folder.name}</div>`
  ).join('\n');

  // Show or hide the "Show More" and "Show Less" buttons based on folder count
  const showMoreButton = document.getElementById('show-more');
  const showLessButton = document.getElementById('show-less');
  const paginationButtons = document.getElementById('pagination-buttons');

  paginationButtons.style.display = folders.length > foldersPerPage ? 'block' : 'none';
  showMoreButton.style.display = !allFoldersShown && folders.length > foldersPerPage ? 'block' : 'none';
  showLessButton.style.display = allFoldersShown && folders.length > foldersPerPage ? 'block' : 'none';

  document.getElementById('file-content').style.display = 'none'; // Hide file content
  document.getElementById('directory').style.display = 'grid'; // Show folders
  addFolderEventListeners();
};


// Function to display files
const showFiles = (files) => {
  document.getElementById('directory').innerHTML = files.map(item =>
    `<div class="file" data-name="${item.name}">${item.name}</div>`
  ).join('\n');

  // Hide pagination buttons
  document.getElementById('pagination-buttons').style.display = 'none';
  document.getElementById('file-content').style.display = 'flex'; // Show file content
  document.getElementById('directory').style.display = 'none'; // Hide folders
  document.getElementById('next-button').style.display = files.length > 1 ? 'block' : 'none'; // Show navigation buttons if multiple files
  document.getElementById('previous-button').style.display = files.length > 1 ? 'block' : 'none'; // Show navigation buttons if multiple files
  addFileEventListeners();

  // Automatically open the first file if available
  if (files.length > 0) {
    currentIndex = 0; // Reset index to 0 when showing new files
    fetchFile(files[0].name);
  }
};

// Add event listeners for folder elements
const addFolderEventListeners = () => {
  document.querySelectorAll('.folder').forEach(element => {
    element.addEventListener('click', (event) => {
      const folderName = event.target.getAttribute('data-name');
      const newPath = currentPath === '/' ? folderName : `${currentPath}/${folderName}`;
      pathHistory.push(currentPath); // Push the current path to history before navigating
      fetchDirectory(newPath);
    });
  });
};

// Add event listeners for file elements
const addFileEventListeners = () => {
  document.querySelectorAll('.file').forEach(element => {
    element.addEventListener('click', (event) => {
      const fileName = event.target.getAttribute('data-name');
      const filePath = currentPath === '/' ? fileName : `${currentPath}/${fileName}`;
      currentIndex = currentFiles.findIndex(file => file.name === fileName); // Set current index to the clicked file
      fetchFile(filePath);
    });
  });
};

// Fetch directory structure
const fetchDirectory = (path = '') => {
  fetch(`/directory?path=${path}`)
    .then(response => response.json())
    .then(data => displayDirectory(data));
};

// Fetch file contents
const fetchFile = (fileName) => {
  const filePath = currentPath === '/' ? fileName : `${currentPath}/${fileName}`;
  const ext = fileName.split('.').pop().toLowerCase();
  const fileUrl = `/file?path=${filePath}`;

  document.getElementById('file-content').style.display = 'flex';
  document.getElementById('text-content').style.display = 'none';
  document.getElementById('pdf-content').style.display = 'none';
  document.getElementById('image-content').style.display = 'none';
  document.getElementById('video-content').style.display = 'none';

  // Update and show the file counter
  const fileCounter = document.getElementById('file-counter');
  fileCounter.textContent = `${currentIndex + 1}/${currentFiles.length}`;
  fileCounter.style.display = 'block';

  if (['txt', 'json', 'js', 'html', 'css', 'py', 'md'].includes(ext)) {
    fetch(fileUrl).then(response => response.text()).then(content => {
      document.getElementById('text-content').textContent = content;
      document.getElementById('text-content').style.display = 'block';
    });
  } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) {
    document.getElementById('image-content').src = fileUrl;
    document.getElementById('image-content').style.display = 'block';
  } else if (['mp4', 'webm'].includes(ext)) {
    document.getElementById('video-content').src = fileUrl;
    document.getElementById('video-content').style.display = 'block';
  } else if (['pdf'].includes(ext)) {
    document.getElementById('pdf-content').src = fileUrl;
    document.getElementById('pdf-content').style.display = 'block';
  } else {
    alert('Unsupported file type');
  }
};

// Function to handle "Show More" button click
const showMoreFolders = () => {
  allFoldersShown = true;
  showFolders(allFolders);
};

// Function to handle "Show Less" button click
const showLessFolders = () => {
  allFoldersShown = false;
  showFolders(allFolders);
};

// Show previous file in the list
const showPrevious = () => {
  if (currentFiles.length > 0) {
    currentIndex = (currentIndex - 1 + currentFiles.length) % currentFiles.length;
    fetchFile(currentFiles[currentIndex].name);
  }
};

// Show next file in the list
const showNext = () => {
  if (currentFiles.length > 0) {
    currentIndex = (currentIndex + 1) % currentFiles.length;
    fetchFile(currentFiles[currentIndex].name);
  }
};

// Go back to the previous directory
const goBack = () => {
  if (pathHistory.length > 0) {
    currentPath = pathHistory.pop(); // Go back to the previous path
    fetchDirectory(currentPath);
  } else {
    // If no history, return to the root or initial directory
    fetchDirectory('/');
  }
};

// Close file content and go back to directory view
const closeFileContent = () => {
  document.getElementById('file-content').style.display = 'none';
  const video = document.getElementById('video-content');
  if (!video.paused) {
    video.pause();
  }
  // Clear the content to reset
  document.getElementById('image-content').src = '';
  document.getElementById('video-content').src = '';
  document.getElementById('pdf-content').src = '';
  document.getElementById('text-content').textContent = '';

  // Reset the file index counter
  currentIndex = 0;

  if (pathHistory.length > 0) {
    currentPath = pathHistory.pop(); // Go back to the previous path
    fetchDirectory(currentPath);
  } else {
    // If no history, return to the root or initial directory
    fetchDirectory('/');
  }
};

// Initial fetch of directory structure
fetchDirectory();

// Listen for directory updates
socket.on('update-directory', data => {
  if (data.path === currentPath) {
    displayDirectory(data);
  }
});

// Listen for file content updates
socket.on('update-file', data => {
  if (data.path === currentFiles[currentIndex]?.name) {
    fetchFile(data.path); // Re-fetch the file to update content
  }
});

const header = document.querySelector("header");
window.addEventListener("scroll",function() {
  header.classList.toggle("sticky",window.scrollY > 0);
});

document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarClose = document.getElementById('sidebar-close');

  sidebarToggle.addEventListener('click', function() {
    sidebar.style.right = sidebar.style.right === '0px' ? '-300px' : '0px';
  });

  sidebarClose.addEventListener('click', function() {
    sidebar.style.right = '-300px';
  });
});
