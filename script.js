document.getElementById('imageInput').addEventListener('change', handleImageUpload);

const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
let img = new Image();
let isSelecting = false;
let isDragging = false;
let isResizing = false;
let startX, startY, endX, endY;
let selectedCrop = null;
let crops = [];
const resizeHandleSize = 10;
const deleteHandleSize = 10;
const previewSize = 100; // Constant size for the crop previews

function handleImageUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            crops = []; // Reset crops on new image upload
            updatePreviews(); // Clear previews
        };
    };
    reader.readAsDataURL(file);
}

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    selectedCrop = crops.find(crop => isInsideCrop(startX, startY, crop));
    if (selectedCrop) {
        if (isOnResizeHandle(startX, startY, selectedCrop)) {
            isResizing = true;
        } else if (isOnDeleteHandle(startX, startY, selectedCrop)) {
            crops = crops.filter(crop => crop !== selectedCrop);
            selectedCrop = null;
            drawCrops();
            updatePreviews();
        } else {
            isDragging = true;
        }
    } else {
        isSelecting = true;
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    endX = e.clientX - rect.left;
    endY = e.clientY - rect.top;

    if (isSelecting) {
        drawSelection();
    } else if (isDragging && selectedCrop) {
        moveCrop(selectedCrop, endX - startX, endY - startY);
        startX = endX;
        startY = endY;
        drawCrops();
        updatePreviews();
    } else if (isResizing && selectedCrop) {
        resizeCrop(selectedCrop, endX, endY);
        drawCrops();
        updatePreviews();
    }

    // Change cursor style
    if (selectedCrop) {
        if (isOnResizeHandle(endX, endY, selectedCrop)) {
            canvas.style.cursor = 'nwse-resize';
        } else if (isOnDeleteHandle(endX, endY, selectedCrop)) {
            canvas.style.cursor = 'pointer';
        } else if (isInsideCrop(endX, endY, selectedCrop)) {
            canvas.style.cursor = 'move';
        } else {
            canvas.style.cursor = 'default';
        }
    } else {
        canvas.style.cursor = 'default';
    }
});

canvas.addEventListener('mouseup', () => {
    if (isSelecting) {
        isSelecting = false;
        const crop = getSquareCrop(startX, startY, endX, endY);
        crops.push(crop);
        updatePreviews();
    }
    isDragging = false;
    isResizing = false;
    drawCrops();
});

function drawSelection() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    const crop = getSquareCrop(startX, startY, endX, endY);
    ctx.strokeRect(crop.x, crop.y, crop.size, crop.size);
}

function drawCrops() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    crops.forEach(crop => {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(crop.x, crop.y, crop.size, crop.size);
        drawResizeHandle(crop);
        drawDeleteHandle(crop);
    });
}

function getSquareCrop(x1, y1, x2, y2) {
    const size = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1));
    return {
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        size,
        displayName: '',
        username: ''
    };
}

function isInsideCrop(x, y, crop) {
    return x >= crop.x && x <= crop.x + crop.size && y >= crop.y && y <= crop.y + crop.size;
}

function isOnResizeHandle(x, y, crop) {
    return x >= crop.x + crop.size - resizeHandleSize && x <= crop.x + crop.size &&
           y >= crop.y + crop.size - resizeHandleSize && y <= crop.y + crop.size;
}

function isOnDeleteHandle(x, y, crop) {
    return x >= crop.x && x <= crop.x + deleteHandleSize &&
           y >= crop.y && y <= crop.y + deleteHandleSize;
}

function moveCrop(crop, dx, dy) {
    crop.x += dx;
    crop.y += dy;
}

function resizeCrop(crop, x, y) {
    const newSize = Math.min(x - crop.x, y - crop.y);
    crop.size = newSize;
}

function drawResizeHandle(crop) {
    ctx.fillStyle = 'blue';
    ctx.fillRect(crop.x + crop.size - resizeHandleSize, crop.y + crop.size - resizeHandleSize, resizeHandleSize, resizeHandleSize);
}

function drawDeleteHandle(crop) {
    ctx.fillStyle = 'red';
    ctx.fillRect(crop.x, crop.y, deleteHandleSize, deleteHandleSize);
}

function updatePreviews() {
    const previewContainer = document.getElementById('cropPreview');
    previewContainer.innerHTML = ''; // Clear existing previews
    crops.forEach((crop, index) => {
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = previewSize;
        cropCanvas.height = previewSize;
        const cropCtx = cropCanvas.getContext('2d');
        
        // Draw circular mask
        cropCtx.save();
        cropCtx.beginPath();
        cropCtx.arc(previewSize / 2, previewSize / 2, previewSize / 2, 0, Math.PI * 2);
        cropCtx.clip();
        cropCtx.drawImage(img, crop.x, crop.y, crop.size, crop.size, 0, 0, previewSize, previewSize);
        cropCtx.restore();

        const previewWrapper = document.createElement('div');
        previewWrapper.style.display = 'flex';
        previewWrapper.style.alignItems = 'center';
        previewWrapper.style.marginBottom = '10px';

        const cropContainer = document.createElement('div');
        cropContainer.style.position = 'relative';

        const cropCanvasWrapper = document.createElement('div');
        cropCanvasWrapper.appendChild(cropCanvas);

        const nameInputs = document.createElement('div');
        nameInputs.style.display = 'flex';
        nameInputs.style.flexDirection = 'column';
        nameInputs.style.marginLeft = '10px';
        nameInputs.style.flex = '1';
        nameInputs.style.fontFamily = 'Arial, sans-serif';
        nameInputs.style.color = '#ffffff';
        
        const displayNameInput = document.createElement('input');
        displayNameInput.type = 'text';
        displayNameInput.placeholder = 'Display Name';
        displayNameInput.value = crop.displayName;
        displayNameInput.style.padding = '5px';
        displayNameInput.style.marginBottom = '5px';
        displayNameInput.style.background = '#2f3136';
        displayNameInput.style.color = '#ffffff';
        displayNameInput.style.border = '1px solid #40444b';
        displayNameInput.style.borderRadius = '4px';
        displayNameInput.addEventListener('input', (e) => {
            crop.displayName = e.target.value;
            e.stopPropagation();
            updatePreviews();
        });

        const usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.placeholder = 'Username';
        usernameInput.value = crop.username;
        usernameInput.style.padding = '5px';
        usernameInput.style.background = '#2f3136';
        usernameInput.style.color = '#ffffff';
        usernameInput.style.border = '1px solid #40444b';
        usernameInput.style.borderRadius = '4px';
        usernameInput.addEventListener('input', (e) => {
            crop.username = e.target.value;
            e.stopPropagation();
            updatePreviews();
        });

        nameInputs.appendChild(displayNameInput);
        nameInputs.appendChild(usernameInput);

        cropContainer.appendChild(cropCanvasWrapper);
        cropContainer.appendChild(nameInputs);

        previewWrapper.appendChild(cropContainer);
        previewContainer.appendChild(previewWrapper);
    });
}

document.getElementById('saveCropsButton').addEventListener('click', () => {
    crops.forEach((crop, index) => {
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = crop.size;
        cropCanvas.height = crop.size;
        const cropCtx = cropCanvas.getContext('2d');
        cropCtx.save();
        cropCtx.beginPath();
        cropCtx.arc(crop.size / 2, crop.size / 2, crop.size / 2, 0, Math.PI * 2);
        cropCtx.clip();
        cropCtx.drawImage(img, crop.x, crop.y, crop.size, crop.size, 0, 0, crop.size, crop.size);
        cropCtx.restore();

        const link = document.createElement('a');
        link.href = cropCanvas.toDataURL();
        link.download = `crop${index + 1}.png`;
        link.click();
    });
});
