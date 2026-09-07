const photoInput = document.getElementById("photoInput");
const paperSize = document.getElementById("paperSize");
const orientationInput = document.getElementById("orientation");
const copiesInput = document.getElementById("copies");
const spacingInput = document.getElementById("spacing");
const bgColorInput = document.getElementById("bgColor");

const paper = document.getElementById("paper");

const photoCount = document.getElementById("photoCount");
const sheetCount = document.getElementById("sheetCount");
const paperLabel = document.getElementById("paperLabel");

const clearBtn = document.getElementById("clearBtn");
const printBtn = document.getElementById("printBtn");

const cropModal = document.getElementById("cropModal");
const cropFrame = document.getElementById("cropFrame");
const cropImage = document.getElementById("cropImage");
const closeCropModal = document.getElementById("closeCropModal");
const cancelCropBtn = document.getElementById("cancelCropBtn");
const applyCropBtn = document.getElementById("applyCropBtn");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const zoomResetBtn = document.getElementById("zoomResetBtn");
const rotateLeftBtn = document.getElementById("rotateLeftBtn");
const rotateRightBtn = document.getElementById("rotateRightBtn");


/*
    Paper dimensions in centimeters
*/

const paperSizes = {

    a4: {
        name: "A4",
        width: 21,
        height: 29.7
    },

    a3: {
        name: "A3",
        width: 29.7,
        height: 42
    },

    "12x18": {
        name: "12 × 18 inch",
        width: 30.48,
        height: 45.72
    }

};


/*
    Polaroid dimensions

    Outer:
    7 × 10 cm

    Photo:
    5.5 × 7 cm
*/

const POLAROID_WIDTH = 7;
const POLAROID_HEIGHT = 10;

const PHOTO_WIDTH = 5.5;
const PHOTO_HEIGHT = 7;

const LANDSCAPE_PHOTO_WIDTH = 8;
const LANDSCAPE_PHOTO_HEIGHT = 5;


/*
    Store uploaded images
*/

let photos = [];

let currentCropPhotoIndex = null;

/*
    Crop editor state
*/

let cropState = {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0
};

let isDragging = false;
let dragStart = { x: 0, y: 0 };
let cropImageStart = { x: 0, y: 0 };

let pinchStartDistance = 0;
let pinchStartScale = 1;


/*
    Background color
*/

function getBgColor() {
    return bgColorInput.value;
}

bgColorInput.addEventListener("input", render);

document.querySelectorAll(".preset").forEach(btn => {
    btn.addEventListener("click", function () {
        bgColorInput.value = this.dataset.color;
        render();
    });
});


/*
    Upload photos
*/

photoInput.addEventListener("change", function () {

    const files = Array.from(this.files);

    files.forEach(file => {

        if (!file.type.startsWith("image/")) {
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {

            const img = new Image();

            img.onload = function () {

                const photo = {
                    src: event.target.result,
                    name: file.name,
                    crop: null,
                    cropped: null,
                    orientation: "portrait"
                };

                generateDefaultCrop(photo, img);

                photos.push(photo);

                render();

            };

            img.src = event.target.result;

        };

        reader.readAsDataURL(file);

    });

    this.value = "";

});


function generateDefaultCrop(photo, img) {

    const portrait = photo.orientation === "portrait";
    const cropFrameWidth = portrait ? 275 : 400;
    const cropFrameHeight = portrait ? 350 : 250;

    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    const minScale = Math.max(
        cropFrameWidth / naturalWidth,
        cropFrameHeight / naturalHeight
    );

    const x = (cropFrameWidth - naturalWidth * minScale) / 2;
    const y = (cropFrameHeight - naturalHeight * minScale) / 2;

    photo.crop = { x, y, scale: minScale };

    generateCroppedDataUrl(photo, img);
}


function generateCroppedDataUrl(photo, img) {

    const portrait = photo.orientation === "portrait";
    const cropFrameWidth = portrait ? 275 : 400;
    const cropFrameHeight = portrait ? 350 : 250;

    const crop = photo.crop;
    const rotation = crop.rotation || 0;

    const sourceX = -crop.x / crop.scale;
    const sourceY = -crop.y / crop.scale;
    const sourceWidth = cropFrameWidth / crop.scale;
    const sourceHeight = cropFrameHeight / crop.scale;

    const canvas = document.createElement("canvas");
    const outputWidth = portrait ? 825 : 1200;
    const outputHeight = portrait ? 1050 : 750;
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext("2d");

    const radians = rotation * Math.PI / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));

    const rotatedWidth = sourceWidth * cos + sourceHeight * sin;
    const rotatedHeight = sourceWidth * sin + sourceHeight * cos;

    ctx.save();

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(radians);

    ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        -sourceWidth / 2,
        -sourceHeight / 2,
        sourceWidth,
        sourceHeight
    );

    ctx.restore();

    photo.cropped = canvas.toDataURL("image/jpeg", 0.92);

}


/*
    Re-render when settings change
*/

paperSize.addEventListener("change", render);
orientationInput.addEventListener("change", render);
copiesInput.addEventListener("input", render);
spacingInput.addEventListener("input", render);
bgColorInput.addEventListener("input", render);


/*
    Orientation helper
*/

function getPhotoDimensions(photo) {
    const portrait = photo.orientation === "portrait";
    return {
        width: portrait ? POLAROID_WIDTH : POLAROID_HEIGHT,
        height: portrait ? POLAROID_HEIGHT : POLAROID_WIDTH,
        photoWidth: portrait ? PHOTO_WIDTH : LANDSCAPE_PHOTO_WIDTH,
        photoHeight: portrait ? PHOTO_HEIGHT : LANDSCAPE_PHOTO_HEIGHT
    };
}

function getDimensions() {
    const portrait = orientationInput.value === "portrait";
    return {
        width: portrait ? POLAROID_WIDTH : POLAROID_HEIGHT,
        height: portrait ? POLAROID_HEIGHT : POLAROID_WIDTH,
        photoWidth: portrait ? PHOTO_WIDTH : PHOTO_HEIGHT,
        photoHeight: portrait ? PHOTO_HEIGHT : PHOTO_WIDTH
    };
}

/*
    Calculate how many Polaroids fit
*/

function calculateLayout() {

    const selected = paperSizes[paperSize.value];
    const spacing = Number(spacingInput.value) || 0;

    let maxPolaroidWidth = POLAROID_WIDTH;
    let maxPolaroidHeight = POLAROID_HEIGHT;

    photos.forEach(photo => {
        const dims = getPhotoDimensions(photo);
        maxPolaroidWidth = Math.max(maxPolaroidWidth, dims.width);
        maxPolaroidHeight = Math.max(maxPolaroidHeight, dims.height);
    });

    let columns = Math.floor(
        (selected.width + spacing) /
        (maxPolaroidWidth + spacing)
    );

    let rows = Math.floor(
        (selected.height + spacing) /
        (maxPolaroidHeight + spacing)
    );

    const normalCount = columns * rows;

    return {
        columns,
        rows,
        count: normalCount,
        rotated: false
    };

}


/*
    Render printable sheet
*/

function render() {

    const selected = paperSizes[paperSize.value];

    const copies = Math.max(
        1,
        Number(copiesInput.value) || 1
    );

    const spacing = Math.max(
        0,
        Number(spacingInput.value) || 0
    );

    const layout = calculateLayout();

    photoCount.textContent = photos.length;
    sheetCount.textContent = layout.count;

    paperLabel.textContent =
        `${selected.name} — ${layout.columns} × ${layout.rows}`;

    paper.style.width = `${selected.width}cm`;
    paper.style.height = `${selected.height}cm`;
    paper.style.background = getBgColor();

    paper.style.gridTemplateColumns =
        `repeat(${layout.columns}, 7cm)`;

    paper.style.gridAutoRows = "10cm";

    paper.style.gap = `${spacing}cm`;

    paper.innerHTML = "";

    if (photos.length === 0) {

        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "Upload photos to create your Polaroid sheet";
        paper.appendChild(empty);

        return;
    }

    photos.forEach((photo, photoIndex) => {

        for (let i = 0; i < copies; i++) {

            const polaroid = document.createElement("div");
            polaroid.className = "polaroid";

            const dims = getPhotoDimensions(photo);

            const wrapper = document.createElement("div");
            wrapper.className = "photo-wrapper";
            wrapper.style.width = `${dims.photoWidth}cm`;
            wrapper.style.height = `${dims.photoHeight}cm`;

            const img = document.createElement("img");
            img.src = photo.cropped || photo.src;
            img.alt = photo.name;

            const actions = document.createElement("div");
            actions.className = "photo-actions";
            actions.style.width = `${dims.photoWidth}cm`;
            actions.style.height = `${dims.photoHeight}cm`;

            const editBtn = document.createElement("button");
            editBtn.className = "edit-crop-btn";
            editBtn.textContent = "Edit Crop";
            editBtn.addEventListener("click", () => openCropEditor(photoIndex));

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-photo-btn";
            deleteBtn.textContent = "Delete";
            deleteBtn.addEventListener("click", () => deletePhoto(photoIndex));

            const orientBtn = document.createElement("button");
            orientBtn.className = "orient-btn";
            orientBtn.textContent = photo.orientation === "portrait" ? "Landscape" : "Portrait";
            orientBtn.addEventListener("click", () => togglePhotoOrientation(photoIndex));

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            actions.appendChild(orientBtn);
            wrapper.appendChild(img);
            wrapper.appendChild(actions);
            polaroid.appendChild(wrapper);

            if (photo.orientation === "landscape") {
                polaroid.classList.add("landscape");
            }

            const corners = ["top-left", "top-right", "bottom-left", "bottom-right"];
            corners.forEach(pos => {
                const mark = document.createElement("div");
                mark.className = `corner-mark ${pos}`;
                polaroid.appendChild(mark);
            });

            paper.appendChild(polaroid);

            if (paper.children.length >= layout.count) {
                break;
            }

        }

    });

}


/*
    Clear everything
*/

clearBtn.addEventListener("click", function () {

    photos = [];
    render();

});


function deletePhoto(index) {

    photos.splice(index, 1);
    render();

}


function togglePhotoOrientation(index) {

    const photo = photos[index];

    if (photo.orientation === "portrait") {
        photo.orientation = "landscape";
    } else {
        photo.orientation = "portrait";
    }

    const img = new Image();
    img.src = photo.src;

    img.onload = function () {
        generateDefaultCrop(photo, img);
        render();
    };

}


/*
    Print
*/

printBtn.addEventListener("click", function () {

    if (photos.length === 0) {
        alert("Please upload at least one photo.");
        return;
    }

    window.print();

});


/*
    Crop Modal
*/

function openCropEditor(photoIndex) {

    currentCropPhotoIndex = photoIndex;

    const photo = photos[photoIndex];

    cropImage.src = photo.src;

    const img = new Image();
    img.src = photo.src;

    img.onload = function () {

        const portrait = photo.orientation === "portrait";
        const cropFrameWidth = portrait ? 275 : 400;
        const cropFrameHeight = portrait ? 350 : 250;

        cropFrame.style.width = cropFrameWidth + "px";
        cropFrame.style.height = cropFrameHeight + "px";

        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;

        const minScale = Math.max(
            cropFrameWidth / naturalWidth,
            cropFrameHeight / naturalHeight
        );

        let crop = photo.crop;

        if (!crop || crop.scale < minScale) {
            crop = {
                x: (cropFrameWidth - naturalWidth * minScale) / 2,
                y: (cropFrameHeight - naturalHeight * minScale) / 2,
                scale: minScale,
                rotation: 0
            };
            photo.crop = crop;
        }

        cropState = {
            x: crop.x,
            y: crop.y,
            scale: crop.scale,
            rotation: crop.rotation || 0
        };

        updateCropTransform();

        cropModal.classList.add("active");

    };

}


function closeCropEditor() {

    cropModal.classList.remove("active");
    currentCropPhotoIndex = null;

}


function updateCropTransform() {

    cropImage.style.transform =
        `translate(${cropState.x}px, ${cropState.y}px) scale(${cropState.scale}) rotate(${cropState.rotation}deg)`;

}


function constrainCrop() {

    const cropFrameWidth = cropFrame.clientWidth;
    const cropFrameHeight = cropFrame.clientHeight;

    const naturalWidth = cropImage.naturalWidth;
    const naturalHeight = cropImage.naturalHeight;

    if (!naturalWidth || !naturalHeight) return;

    const minScale = Math.max(
        cropFrameWidth / naturalWidth,
        cropFrameHeight / naturalHeight
    );

    cropState.scale = Math.max(minScale, cropState.scale);

    const maxX = 0;
    const minX = cropFrameWidth - naturalWidth * cropState.scale;
    const maxY = 0;
    const minY = cropFrameHeight - naturalHeight * cropState.scale;

    cropState.x = Math.min(maxX, Math.max(minX, cropState.x));
    cropState.y = Math.min(maxY, Math.max(minY, cropState.y));

}


function applyCrop() {

    if (currentCropPhotoIndex === null) return;

    constrainCrop();

    const photo = photos[currentCropPhotoIndex];
    photo.crop = {
        x: cropState.x,
        y: cropState.y,
        scale: cropState.scale,
        rotation: cropState.rotation
    };

    const img = new Image();
    img.src = photo.src;

    img.onload = function () {
        generateCroppedDataUrl(photo, img);
        render();
        closeCropEditor();
    };

}


function resetCrop() {

    const portrait = currentCropPhotoIndex !== null &&
        photos[currentCropPhotoIndex].orientation === "portrait";
    const cropFrameWidth = portrait ? 275 : 400;
    const cropFrameHeight = portrait ? 350 : 250;

    const naturalWidth = cropImage.naturalWidth;
    const naturalHeight = cropImage.naturalHeight;

    if (!naturalWidth || !naturalHeight) return;

    const minScale = Math.max(
        cropFrameWidth / naturalWidth,
        cropFrameHeight / naturalHeight
    );

    cropState.scale = minScale;
    cropState.x = (cropFrameWidth - naturalWidth * minScale) / 2;
    cropState.y = (cropFrameHeight - naturalHeight * minScale) / 2;

    updateCropTransform();

}


/*
    Mouse interactions
*/

cropFrame.addEventListener("mousedown", function (e) {

    if (e.button !== 0) return;

    isDragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    cropImageStart = { x: cropState.x, y: cropState.y };

    e.preventDefault();

});


window.addEventListener("mousemove", function (e) {

    if (!isDragging) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    cropState.x = cropImageStart.x + dx;
    cropState.y = cropImageStart.y + dy;

    constrainCrop();
    updateCropTransform();

});


window.addEventListener("mouseup", function () {

    isDragging = false;

});


cropFrame.addEventListener("wheel", function (e) {

    e.preventDefault();

    const zoomFactor = e.deltaY < 0 ? 1.08 : 1 / 1.08;

    const rect = cropFrame.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const oldScale = cropState.scale;
    const newScale = Math.max(0.01, oldScale * zoomFactor);

    const scaleChange = newScale / oldScale;

    cropState.x = mouseX - (mouseX - cropState.x) * scaleChange;
    cropState.y = mouseY - (mouseY - cropState.y) * scaleChange;
    cropState.scale = newScale;

    constrainCrop();
    updateCropTransform();

}, { passive: false });


/*
    Touch interactions
*/

cropFrame.addEventListener("touchstart", function (e) {

    if (e.touches.length === 1) {

        isDragging = true;
        dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        cropImageStart = { x: cropState.x, y: cropState.y };

    } else if (e.touches.length === 2) {

        isDragging = false;

        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;

        pinchStartDistance = Math.sqrt(dx * dx + dy * dy);
        pinchStartScale = cropState.scale;

    }

    e.preventDefault();

}, { passive: false });


cropFrame.addEventListener("touchmove", function (e) {

    if (e.touches.length === 1 && isDragging) {

        const dx = e.touches[0].clientX - dragStart.x;
        const dy = e.touches[0].clientY - dragStart.y;

        cropState.x = cropImageStart.x + dx;
        cropState.y = cropImageStart.y + dy;

        constrainCrop();
        updateCropTransform();

    } else if (e.touches.length === 2) {

        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (pinchStartDistance > 0) {

            const scale = pinchStartScale * (distance / pinchStartDistance);

            cropState.scale = Math.max(0.01, scale);

            constrainCrop();
            updateCropTransform();

        }

    }

    e.preventDefault();

}, { passive: false });


cropFrame.addEventListener("touchend", function () {

    isDragging = false;
    pinchStartDistance = 0;

});


/*
    Zoom buttons
*/

zoomInBtn.addEventListener("click", function () {

    const rect = cropFrame.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const oldScale = cropState.scale;
    const newScale = Math.min(10, oldScale * 1.2);

    const scaleChange = newScale / oldScale;

    cropState.x = centerX - (centerX - cropState.x) * scaleChange;
    cropState.y = centerY - (centerY - cropState.y) * scaleChange;
    cropState.scale = newScale;

    constrainCrop();
    updateCropTransform();

});


zoomOutBtn.addEventListener("click", function () {

    const rect = cropFrame.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const oldScale = cropState.scale;
    const newScale = Math.max(0.01, oldScale / 1.2);

    const scaleChange = newScale / oldScale;

    cropState.x = centerX - (centerX - cropState.x) * scaleChange;
    cropState.y = centerY - (centerY - cropState.y) * scaleChange;
    cropState.scale = newScale;

    constrainCrop();
    updateCropTransform();

});


zoomResetBtn.addEventListener("click", resetCrop);

rotateLeftBtn.addEventListener("click", function () {
    rotateImage(-90);
});

rotateRightBtn.addEventListener("click", function () {
    rotateImage(90);
});

function rotateImage(degrees) {

    const portrait = currentCropPhotoIndex !== null &&
        photos[currentCropPhotoIndex].orientation === "portrait";

    const cropFrameWidth = portrait ? 275 : 400;
    const cropFrameHeight = portrait ? 350 : 250;

    const naturalWidth = cropImage.naturalWidth;
    const naturalHeight = cropImage.naturalHeight;

    if (!naturalWidth || !naturalHeight) return;

    const oldRotation = cropState.rotation || 0;
    const newRotation = (oldRotation + degrees) % 360;

    const oldRadians = oldRotation * Math.PI / 180;
    const newRadians = newRotation * Math.PI / 180;

    const oldCos = Math.abs(Math.cos(oldRadians));
    const oldSin = Math.abs(Math.sin(oldRadians));
    const newCos = Math.abs(Math.cos(newRadians));
    const newSin = Math.abs(Math.sin(newRadians));

    const oldEffectiveWidth = naturalWidth * oldCos + naturalHeight * oldSin;
    const oldEffectiveHeight = naturalWidth * oldSin + naturalHeight * oldCos;

    const newEffectiveWidth = naturalWidth * newCos + naturalHeight * newSin;
    const newEffectiveHeight = naturalWidth * newSin + naturalHeight * newCos;

    const oldScale = cropState.scale;
    const oldDisplayWidth = oldEffectiveWidth * oldScale;
    const oldDisplayHeight = oldEffectiveHeight * oldScale;

    const centerX = cropState.x + oldDisplayWidth / 2;
    const centerY = cropState.y + oldDisplayHeight / 2;

    const newScale = Math.max(
        cropFrameWidth / newEffectiveWidth,
        cropFrameHeight / newEffectiveHeight
    );

    const newDisplayWidth = newEffectiveWidth * newScale;
    const newDisplayHeight = newEffectiveHeight * newScale;

    cropState.rotation = newRotation;
    cropState.scale = newScale;
    cropState.x = centerX - newDisplayWidth / 2;
    cropState.y = centerY - newDisplayHeight / 2;

    constrainCrop();
    updateCropTransform();

}


/*
    Modal actions
*/

closeCropModal.addEventListener("click", closeCropEditor);
cancelCropBtn.addEventListener("click", closeCropEditor);
applyCropBtn.addEventListener("click", applyCrop);

cropModal.querySelector(".crop-modal-backdrop").addEventListener("click", closeCropEditor);

document.addEventListener("keydown", function (e) {

    if (e.key === "Escape" && cropModal.classList.contains("active")) {
        closeCropEditor();
    }

});


/*
    Initial render
*/

render();
