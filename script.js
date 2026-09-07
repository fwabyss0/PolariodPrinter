const photoInput = document.getElementById("photoInput");
const paperSizeInput = document.getElementById("paperSize");
const customSizeGroup = document.getElementById("customSizeGroup");
const customWidth = document.getElementById("customWidth");
const customHeight = document.getElementById("customHeight");
const customUnit = document.getElementById("customUnit");
const paperPortraitBtn = document.getElementById("paperPortraitBtn");
const paperLandscapeBtn = document.getElementById("paperLandscapeBtn");
const polaroidPortraitBtn = document.getElementById("polaroidPortraitBtn");
const polaroidLandscapeBtn = document.getElementById("polaroidLandscapeBtn");
const spacingInput = document.getElementById("spacing");
const uniformMarginCheckbox = document.getElementById("uniformMargin");
const uniformMarginGroup = document.getElementById("uniformMarginGroup");
const uniformMarginValue = document.getElementById("uniformMarginValue");
const advancedMarginGroup = document.getElementById("advancedMarginGroup");
const marginTop = document.getElementById("marginTop");
const marginBottom = document.getElementById("marginBottom");
const marginLeft = document.getElementById("marginLeft");
const marginRight = document.getElementById("marginRight");
const cutMarksCheckbox = document.getElementById("cutMarks");
const bgColorInput = document.getElementById("bgColor");
const applyTextToAllCheckbox = document.getElementById("applyTextToAll");
const polaroidTextInput = document.getElementById("polaroidText");
const fontSizeInput = document.getElementById("fontSize");
const fontFamilyInput = document.getElementById("fontFamily");
const textAlignInput = document.getElementById("textAlign");
const textColorInput = document.getElementById("textColor");

const paper = document.getElementById("paper");
const layoutInfo = document.getElementById("layoutInfo");
const photoList = document.getElementById("photoList");
const dropZone = document.getElementById("dropZone");

const clearBtn = document.getElementById("clearBtn");
const printBtn = document.getElementById("printBtn");
const saveBtn = document.getElementById("saveBtn");

const cropModal = document.getElementById("cropModal");
const cropFrame = document.getElementById("cropFrame");
const cropCanvas = document.getElementById("cropCanvas");
const cropImage = new Image();
const closeCropModal = document.getElementById("closeCropModal");
const cancelCropBtn = document.getElementById("cancelCropBtn");
const applyCropBtn = document.getElementById("applyCropBtn");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const zoomResetBtn = document.getElementById("zoomResetBtn");
const rotateLeftBtn = document.getElementById("rotateLeftBtn");
const rotateRightBtn = document.getElementById("rotateRightBtn");

const textModal = document.getElementById("textModal");
const closeTextModal = document.getElementById("closeTextModal");
const cancelTextBtn = document.getElementById("cancelTextBtn");
const applyTextBtn = document.getElementById("applyTextBtn");
const editPhotoText = document.getElementById("editPhotoText");
const editFontSize = document.getElementById("editFontSize");
const editFontFamily = document.getElementById("editFontFamily");
const editTextAlign = document.getElementById("editTextAlign");
const editTextColor = document.getElementById("editTextColor");

let cropImageLoaded = false;
let currentCropPhotoIndex = null;
let currentTextPhotoIndex = null;

cropImage.onload = function () {
    cropImageLoaded = true;
};
cropImage.onerror = function () {
    cropImageLoaded = false;
};

const paperSizes = {
    a0: { name: "A0", width: 84.1, height: 118.9 },
    a1: { name: "A1", width: 59.4, height: 84.1 },
    a2: { name: "A2", width: 42, height: 59.4 },
    a3: { name: "A3", width: 29.7, height: 42 },
    a4: { name: "A4", width: 21, height: 29.7 },
    a5: { name: "A5", width: 14.8, height: 21 },
    a6: { name: "A6", width: 10.5, height: 14.8 },
    letter: { name: "Letter", width: 21.59, height: 27.94 },
    legal: { name: "Legal", width: 21.59, height: 35.56 },
    tabloid: { name: "Tabloid", width: 27.94, height: 43.18 },
    "11x17": { name: "11 × 17 inch", width: 27.94, height: 43.18 },
    "12x18": { name: "12 × 18 inch", width: 30.48, height: 45.72 },
    "13x19": { name: "13 × 19 inch", width: 33.02, height: 48.26 },
    custom: { name: "Custom", width: 21, height: 29.7 }
};

const FORMATS = {
    portrait: {
        polaroidWidth: 7,
        polaroidHeight: 10,
        photoWidth: 5.5,
        photoHeight: 7,
        paddingTop: 0.6,
        paddingBottom: 0.8,
        paddingLeft: 0.75,
        paddingRight: 0.75,
        cropWidth: 275,
        cropHeight: 350,
        outputWidth: 825,
        outputHeight: 1050
    },
    landscape: {
        polaroidWidth: 10,
        polaroidHeight: 7,
        photoWidth: 8,
        photoHeight: 5,
        paddingTop: 0.75,
        paddingBottom: 0.6,
        paddingLeft: 0.8,
        paddingRight: 0.8,
        cropWidth: 400,
        cropHeight: 250,
        outputWidth: 1200,
        outputHeight: 750
    }
};

let photos = [];
let paperOrientation = "portrait";
let polaroidOrientation = "portrait";

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

function getEffectiveWidth(naturalWidth, naturalHeight, rotation) {
    const deg = ((rotation % 360) + 360) % 360;
    if (deg === 90 || deg === 270) return naturalHeight;
    return naturalWidth;
}

function getEffectiveHeight(naturalWidth, naturalHeight, rotation) {
    const deg = ((rotation % 360) + 360) % 360;
    if (deg === 90 || deg === 270) return naturalWidth;
    return naturalHeight;
}

function getPaperDimensions() {
    const size = paperSizes[paperSizeInput.value];
    if (!size) return { width: 21, height: 29.7, name: "A4" };

    let width = size.width;
    let height = size.height;

    if (paperSizeInput.value === "custom") {
        width = parseFloat(customWidth.value) || 21;
        height = parseFloat(customHeight.value) || 29.7;
        const unit = customUnit.value;
        if (unit === "mm") {
            width = width / 10;
            height = height / 10;
        } else if (unit === "inch") {
            width = width * 2.54;
            height = height * 2.54;
        }
    }

    if (paperOrientation === "landscape") {
        return { width: height, height: width, name: size.name };
    }

    return { width, height, name: size.name };
}

function getCurrentFormat() {
    return FORMATS[polaroidOrientation] || FORMATS.portrait;
}

function getMargins() {
    if (uniformMarginCheckbox.checked) {
        const m = parseFloat(uniformMarginValue.value) || 0;
        return { top: m, bottom: m, left: m, right: m };
    }
    return {
        top: parseFloat(marginTop.value) || 0,
        bottom: parseFloat(marginBottom.value) || 0,
        left: parseFloat(marginLeft.value) || 0,
        right: parseFloat(marginRight.value) || 0
    };
}

function getSpacing() {
    return parseFloat(spacingInput.value) || 0;
}

function getBgColor() {
    return bgColorInput.value;
}

function calculateLayout() {
    const paper = getPaperDimensions();
    const format = getCurrentFormat();
    const margin = getMargins();
    const spacing = getSpacing();

    const availableWidth = paper.width - margin.left - margin.right;
    const availableHeight = paper.height - margin.top - margin.bottom;

    const columns = Math.max(1, Math.floor((availableWidth + spacing) / (format.polaroidWidth + spacing)));
    const rows = Math.max(1, Math.floor((availableHeight + spacing) / (format.polaroidHeight + spacing)));

    return {
        columns,
        rows,
        count: columns * rows,
        availableWidth,
        availableHeight
    };
}

function render() {
    const paper = getPaperDimensions();
    const format = getCurrentFormat();
    const margin = getMargins();
    const spacing = getSpacing();
    const layout = calculateLayout();

    layoutInfo.textContent = `${paper.name} ${paperOrientation === 'landscape' ? 'Landscape' : 'Portrait'} — ${layout.columns} × ${layout.rows} — ${layout.count} polaroids`;

    paper.style.width = paper.width + 'cm';
    paper.style.height = paper.height + 'cm';
    paper.style.background = getBgColor();
    paper.style.padding = '0';

    paper.innerHTML = "";

    if (photos.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "Upload photos to create your Polaroid sheet";
        paper.appendChild(empty);
        return;
    }

    const cutMarks = cutMarksCheckbox.checked;
    if (cutMarks) {
        paper.classList.add("cut-marks-enabled");
    } else {
        paper.classList.remove("cut-marks-enabled");
    }

    let placed = 0;
    photos.forEach((photo, photoIndex) => {
        const copies = Math.max(1, parseInt(photo.copies) || 1);
        for (let c = 0; c < copies; c++) {
            if (placed >= layout.count) break;

            const col = placed % layout.columns;
            const row = Math.floor(placed / layout.columns);

            const x = margin.left + col * (format.polaroidWidth + spacing);
            const y = margin.top + row * (format.polaroidHeight + spacing);

            const polaroid = createPolaroid(photo, photoIndex, format);
            polaroid.style.position = 'absolute';
            polaroid.style.left = x + 'cm';
            polaroid.style.top = y + 'cm';
            polaroid.style.width = format.polaroidWidth + 'cm';
            polaroid.style.height = format.polaroidHeight + 'cm';

            paper.appendChild(polaroid);
            placed++;
        }
    });
}

function createPolaroid(photo, photoIndex, format) {
    const polaroid = document.createElement("div");
    polaroid.className = "polaroid";
    if (polaroidOrientation === "landscape") {
        polaroid.classList.add("landscape");
    }

    const wrapper = document.createElement("div");
    wrapper.className = "photo-wrapper";
    wrapper.style.width = format.photoWidth + 'cm';
    wrapper.style.height = format.photoHeight + 'cm';
    wrapper.style.marginTop = format.paddingTop + 'cm';
    wrapper.style.marginLeft = format.paddingLeft + 'cm';
    wrapper.style.marginRight = format.paddingRight + 'cm';

    const img = document.createElement("img");
    img.src = photo.cropped || photo.src;
    img.alt = photo.name;

    const actions = document.createElement("div");
    actions.className = "photo-actions";
    actions.style.width = format.photoWidth + 'cm';
    actions.style.height = format.photoHeight + 'cm';

    const editBtn = document.createElement("button");
    editBtn.className = "photo-action-btn";
    editBtn.textContent = "Edit Crop";
    editBtn.addEventListener("click", () => openCropEditor(photoIndex));

    const textBtn = document.createElement("button");
    textBtn.className = "photo-action-btn";
    textBtn.textContent = "Edit Text";
    textBtn.addEventListener("click", () => openTextEditor(photoIndex));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "photo-action-btn danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deletePhoto(photoIndex));

    actions.appendChild(editBtn);
    actions.appendChild(textBtn);
    actions.appendChild(deleteBtn);
    wrapper.appendChild(img);
    wrapper.appendChild(actions);
    polaroid.appendChild(wrapper);

    if (photo.text && photo.text.trim() !== "") {
        const textEl = document.createElement("div");
        textEl.className = "photo-text";
        textEl.textContent = photo.text;
        textEl.style.fontSize = (photo.fontSize || 16) + 'px';
        textEl.style.fontFamily = (photo.fontFamily || 'Arial') + ', sans-serif';
        textEl.style.textAlign = photo.textAlign || 'center';
        textEl.style.color = photo.textColor || '#000000';
        textEl.style.paddingBottom = (format.paddingBottom - 0.1) + 'cm';
        textEl.style.paddingLeft = format.paddingLeft + 'cm';
        textEl.style.paddingRight = format.paddingRight + 'cm';
        polaroid.appendChild(textEl);
    }

    const corners = ["top-left", "top-right", "bottom-left", "bottom-right"];
    corners.forEach(pos => {
        const mark = document.createElement("div");
        mark.className = `corner-mark ${pos}`;
        polaroid.appendChild(mark);
    });

    return polaroid;
}

function updatePhotoList() {
    photoList.innerHTML = "";

    if (photos.length === 0) {
        photoList.innerHTML = '<p class="empty">No photos uploaded yet</p>';
        return;
    }

    photos.forEach((photo, index) => {
        const card = document.createElement("div");
        card.className = "photo-card";
        card.draggable = true;

        card.innerHTML = `
            <div class="photo-thumb">
                <img src="${photo.cropped || photo.src}" alt="${photo.name}">
            </div>
            <div class="photo-info">
                <div class="photo-name">${photo.name}</div>
                <div class="photo-meta">${photo.orientation}</div>
                <div class="photo-quantity">
                    <label>Copies:</label>
                    <input type="number" class="photo-copies" data-index="${index}" value="${photo.copies || 1}" min="1" max="100">
                </div>
            </div>
            <div class="photo-actions">
                <button class="photo-action-btn edit-crop-btn" data-index="${index}">Crop</button>
                <button class="photo-action-btn edit-text-btn" data-index="${index}">Text</button>
                <button class="photo-action-btn danger delete-btn" data-index="${index}">Delete</button>
            </div>
        `;

        card.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", index);
            card.classList.add("dragging");
        });

        card.addEventListener("dragend", () => {
            card.classList.remove("dragging");
        });

        card.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        card.addEventListener("drop", (e) => {
            e.preventDefault();
            const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
            const toIndex = index;
            if (fromIndex !== toIndex) {
                const item = photos.splice(fromIndex, 1)[0];
                photos.splice(toIndex, 0, item);
                render();
                updatePhotoList();
            }
        });

        photoList.appendChild(card);
    });

    photoList.querySelectorAll(".photo-copies").forEach(input => {
        input.addEventListener("change", (e) => {
            const index = parseInt(e.target.dataset.index);
            photos[index].copies = Math.max(1, parseInt(e.target.value) || 1);
            render();
            saveLayout();
        });
    });

    photoList.querySelectorAll(".edit-crop-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            openCropEditor(parseInt(e.target.dataset.index));
        });
    });

    photoList.querySelectorAll(".edit-text-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            openTextEditor(parseInt(e.target.dataset.index));
        });
    });

    photoList.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            deletePhoto(parseInt(e.target.dataset.index));
        });
    });
}

function deletePhoto(index) {
    photos.splice(index, 1);
    render();
    updatePhotoList();
    saveLayout();
}

function generateDefaultCrop(photo, img) {
    const format = getCurrentFormat();
    const cropFrameWidth = format.cropWidth;
    const cropFrameHeight = format.cropHeight;

    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    const minScale = Math.max(
        cropFrameWidth / naturalWidth,
        cropFrameHeight / naturalHeight
    );

    const x = cropFrameWidth / 2;
    const y = cropFrameHeight / 2;

    photo.crop = { x, y, scale: minScale, rotation: 0 };
    generateCroppedDataUrl(photo, img);
}

function generateCroppedDataUrl(photo, img) {
    const format = getCurrentFormat();
    const crop = photo.crop;
    const rotation = crop.rotation || 0;

    const canvas = document.createElement("canvas");
    canvas.width = format.outputWidth;
    canvas.height = format.outputHeight;

    const ctx = canvas.getContext("2d");

    const scale = format.outputWidth / format.cropWidth;

    ctx.translate(canvas.width / 2 + crop.x * scale, canvas.height / 2 + crop.y * scale);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.scale(crop.scale * scale, crop.scale * scale);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

    photo.cropped = canvas.toDataURL("image/jpeg", 0.92);
}

function openCropEditor(photoIndex) {
    currentCropPhotoIndex = photoIndex;
    const photo = photos[photoIndex];
    const format = getCurrentFormat();

    cropImage.onload = null;
    cropImage.onerror = null;
    cropImageLoaded = false;

    cropImage.src = photo.src;

    cropImage.onload = function () {
        cropImageLoaded = true;

        cropCanvas.width = format.cropWidth;
        cropCanvas.height = format.cropHeight;
        cropFrame.style.width = format.cropWidth + "px";
        cropFrame.style.height = format.cropHeight + "px";

        const naturalWidth = cropImage.naturalWidth;
        const naturalHeight = cropImage.naturalHeight;

        const minScale = Math.max(
            format.cropWidth / naturalWidth,
            format.cropHeight / naturalHeight
        );

        let crop = photo.crop;
        if (!crop || crop.scale < minScale) {
            crop = {
                x: format.cropWidth / 2,
                y: format.cropHeight / 2,
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

        constrainCrop();
        updateCropTransform();
        cropModal.classList.add("active");
    };

    cropImage.onerror = function () {
        cropImageLoaded = false;
        const ctx = cropCanvas.getContext("2d");
        ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
    };
}

function closeCropEditor() {
    cropModal.classList.remove("active");
    currentCropPhotoIndex = null;
}

function updateCropTransform() {
    const ctx = cropCanvas.getContext("2d");
    const width = cropCanvas.width;
    const height = cropCanvas.height;

    ctx.clearRect(0, 0, width, height);
    if (!cropImageLoaded) return;

    ctx.save();
    ctx.translate(width / 2 + cropState.x, height / 2 + cropState.y);
    ctx.rotate((cropState.rotation || 0) * Math.PI / 180);
    ctx.scale(cropState.scale, cropState.scale);
    ctx.drawImage(cropImage, -cropImage.naturalWidth / 2, -cropImage.naturalHeight / 2);
    ctx.restore();
}

function constrainCrop() {
    const format = getCurrentFormat();
    const cropFrameWidth = cropFrame.clientWidth || format.cropWidth;
    const cropFrameHeight = cropFrame.clientHeight || format.cropHeight;

    const naturalWidth = cropImage.naturalWidth;
    const naturalHeight = cropImage.naturalHeight;
    if (!naturalWidth || !naturalHeight) return;

    const rotation = cropState.rotation || 0;
    const effectiveW = getEffectiveWidth(naturalWidth, naturalHeight, rotation);
    const effectiveH = getEffectiveHeight(naturalWidth, naturalHeight, rotation);

    const minScale = Math.max(
        cropFrameWidth / effectiveW,
        cropFrameHeight / effectiveH
    );

    cropState.scale = Math.max(minScale, cropState.scale);

    const maxX = cropState.scale * effectiveW / 2 - cropFrameWidth / 2;
    const maxY = cropState.scale * effectiveH / 2 - cropFrameHeight / 2;

    cropState.x = Math.min(maxX, Math.max(-maxX, cropState.x));
    cropState.y = Math.min(maxY, Math.max(-maxY, cropState.y));
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
        updatePhotoList();
        closeCropEditor();
        saveLayout();
    };
}

function resetCrop() {
    const format = getCurrentFormat();
    const cropFrameWidth = format.cropWidth;
    const cropFrameHeight = format.cropHeight;

    const naturalWidth = cropImage.naturalWidth;
    const naturalHeight = cropImage.naturalHeight;
    if (!naturalWidth || !naturalHeight) return;

    const minScale = Math.max(
        cropFrameWidth / naturalWidth,
        cropFrameHeight / naturalHeight
    );

    cropState.scale = minScale;
    cropState.x = cropFrameWidth / 2;
    cropState.y = cropFrameHeight / 2;
    cropState.rotation = 0;

    constrainCrop();
    updateCropTransform();
}

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
    const cropFrameWidth = cropFrame.clientWidth;
    const cropFrameHeight = cropFrame.clientHeight;

    const imgRelX = mouseX - cropFrameWidth / 2 - cropState.x;
    const imgRelY = mouseY - cropFrameHeight / 2 - cropState.y;

    const oldScale = cropState.scale;
    const newScale = Math.max(0.01, oldScale * zoomFactor);

    cropState.x = mouseX - cropFrameWidth / 2 - imgRelX * newScale / oldScale;
    cropState.y = mouseY - cropFrameHeight / 2 - imgRelY * newScale / oldScale;
    cropState.scale = newScale;

    constrainCrop();
    updateCropTransform();
}, { passive: false });

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

zoomInBtn.addEventListener("click", function () {
    const oldScale = cropState.scale;
    const newScale = Math.min(10, oldScale * 1.2);
    const scaleChange = newScale / oldScale;
    cropState.x *= scaleChange;
    cropState.y *= scaleChange;
    cropState.scale = newScale;
    constrainCrop();
    updateCropTransform();
});

zoomOutBtn.addEventListener("click", function () {
    const oldScale = cropState.scale;
    const newScale = Math.max(0.01, oldScale / 1.2);
    const scaleChange = newScale / oldScale;
    cropState.x *= scaleChange;
    cropState.y *= scaleChange;
    cropState.scale = newScale;
    constrainCrop();
    updateCropTransform();
});

zoomResetBtn.addEventListener("click", resetCrop);
rotateLeftBtn.addEventListener("click", function () { rotateImage(-90); });
rotateRightBtn.addEventListener("click", function () { rotateImage(90); });

function rotateImage(degrees) {
    const format = getCurrentFormat();
    const cropFrameWidth = format.cropWidth;
    const cropFrameHeight = format.cropHeight;

    const naturalWidth = cropImage.naturalWidth;
    const naturalHeight = cropImage.naturalHeight;
    if (!naturalWidth || !naturalHeight) return;

    const oldRotation = cropState.rotation || 0;
    const newRotation = ((oldRotation + degrees) % 360 + 360) % 360;

    const newEffectiveW = getEffectiveWidth(naturalWidth, naturalHeight, newRotation);
    const newEffectiveH = getEffectiveHeight(naturalWidth, naturalHeight, newRotation);

    const minScale = Math.max(
        cropFrameWidth / newEffectiveW,
        cropFrameHeight / newEffectiveH
    );

    cropState.scale = Math.max(minScale, cropState.scale);
    cropState.rotation = newRotation;

    constrainCrop();
    updateCropTransform();
}

closeCropModal.addEventListener("click", closeCropEditor);
cancelCropBtn.addEventListener("click", closeCropEditor);
applyCropBtn.addEventListener("click", applyCrop);
cropModal.querySelector(".crop-modal-backdrop").addEventListener("click", closeCropEditor);

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && cropModal.classList.contains("active")) {
        closeCropEditor();
    }
});

/* Text Editor */

function openTextEditor(photoIndex) {
    currentTextPhotoIndex = photoIndex;
    const photo = photos[photoIndex];

    editPhotoText.value = photo.text || "";
    editFontSize.value = photo.fontSize || 16;
    editFontFamily.value = photo.fontFamily || "Arial";
    editTextAlign.value = photo.textAlign || "center";
    editTextColor.value = photo.textColor || "#000000";

    textModal.classList.add("active");
}

function closeTextEditor() {
    textModal.classList.remove("active");
    currentTextPhotoIndex = null;
}

function applyText() {
    if (currentTextPhotoIndex === null) return;
    const text = editPhotoText.value;
    const fontSize = parseInt(editFontSize.value) || 16;
    const fontFamily = editFontFamily.value;
    const textAlign = editTextAlign.value;
    const textColor = editTextColor.value;

    if (applyTextToAllCheckbox.checked) {
        photos.forEach(photo => {
            photo.text = text;
            photo.fontSize = fontSize;
            photo.fontFamily = fontFamily;
            photo.textAlign = textAlign;
            photo.textColor = textColor;
        });
    } else {
        const photo = photos[currentTextPhotoIndex];
        photo.text = text;
        photo.fontSize = fontSize;
        photo.fontFamily = fontFamily;
        photo.textAlign = textAlign;
        photo.textColor = textColor;
    }

    render();
    updatePhotoList();
    closeTextEditor();
    saveLayout();
}

closeTextModal.addEventListener("click", closeTextEditor);
cancelTextBtn.addEventListener("click", closeTextEditor);
applyTextBtn.addEventListener("click", applyText);
textModal.querySelector(".crop-modal-backdrop").addEventListener("click", closeTextEditor);

/* Upload */

photoInput.addEventListener("change", function () {
    const files = Array.from(this.files);
    files.forEach(file => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                const photo = {
                    src: event.target.result,
                    name: file.name,
                    crop: null,
                    cropped: null,
                    orientation: polaroidOrientation,
                    copies: 1,
                    text: "",
                    fontSize: parseInt(fontSizeInput.value) || 16,
                    fontFamily: fontFamilyInput.value,
                    textAlign: textAlignInput.value,
                    textColor: textColorInput.value
                };
                generateDefaultCrop(photo, img);
                photos.push(photo);
                render();
                updatePhotoList();
                saveLayout();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
    this.value = "";
});

dropZone.addEventListener("dragover", function (e) {
    e.preventDefault();
    dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", function () {
    dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", function (e) {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                const photo = {
                    src: event.target.result,
                    name: file.name,
                    crop: null,
                    cropped: null,
                    orientation: polaroidOrientation,
                    copies: 1,
                    text: "",
                    fontSize: parseInt(fontSizeInput.value) || 16,
                    fontFamily: fontFamilyInput.value,
                    textAlign: textAlignInput.value,
                    textColor: textColorInput.value
                };
                generateDefaultCrop(photo, img);
                photos.push(photo);
                render();
                updatePhotoList();
                saveLayout();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
});

/* Settings Events */

paperSizeInput.addEventListener("change", function () {
    if (paperSizeInput.value === "custom") {
        customSizeGroup.style.display = "block";
    } else {
        customSizeGroup.style.display = "none";
    }
    render();
    saveLayout();
});

customWidth.addEventListener("input", render);
customHeight.addEventListener("input", render);
customUnit.addEventListener("change", render);

function setPaperOrientation(orientation) {
    paperOrientation = orientation;
    if (orientation === "portrait") {
        paperPortraitBtn.classList.add("active");
        paperLandscapeBtn.classList.remove("active");
    } else {
        paperPortraitBtn.classList.remove("active");
        paperLandscapeBtn.classList.add("active");
    }
    render();
    saveLayout();
}

paperPortraitBtn.addEventListener("click", () => setPaperOrientation("portrait"));
paperLandscapeBtn.addEventListener("click", () => setPaperOrientation("landscape"));

function setPolaroidOrientation(orientation) {
    polaroidOrientation = orientation;
    if (orientation === "portrait") {
        polaroidPortraitBtn.classList.add("active");
        polaroidLandscapeBtn.classList.remove("active");
    } else {
        polaroidPortraitBtn.classList.remove("active");
        polaroidLandscapeBtn.classList.add("active");
    }
    photos.forEach(photo => {
        photo.orientation = orientation;
        const img = new Image();
        img.src = photo.src;
        img.onload = function () {
            generateDefaultCrop(photo, img);
        };
    });
    render();
    updatePhotoList();
    saveLayout();
}

polaroidPortraitBtn.addEventListener("click", () => setPolaroidOrientation("portrait"));
polaroidLandscapeBtn.addEventListener("click", () => setPolaroidOrientation("landscape"));

spacingInput.addEventListener("change", render);
uniformMarginCheckbox.addEventListener("change", function () {
    if (uniformMarginCheckbox.checked) {
        uniformMarginGroup.style.display = "block";
        advancedMarginGroup.style.display = "none";
    } else {
        uniformMarginGroup.style.display = "none";
        advancedMarginGroup.style.display = "block";
    }
    render();
});
uniformMarginValue.addEventListener("input", render);
marginTop.addEventListener("input", render);
marginBottom.addEventListener("input", render);
marginLeft.addEventListener("input", render);
marginRight.addEventListener("input", render);
cutMarksCheckbox.addEventListener("change", render);
bgColorInput.addEventListener("input", render);

document.querySelectorAll(".preset").forEach(btn => {
    btn.addEventListener("click", function () {
        bgColorInput.value = this.dataset.color;
        render();
        saveLayout();
    });
});

applyTextToAllCheckbox.addEventListener("change", saveLayout);
polaroidTextInput.addEventListener("input", saveLayout);
fontSizeInput.addEventListener("input", saveLayout);
fontFamilyInput.addEventListener("change", saveLayout);
textAlignInput.addEventListener("change", saveLayout);
textColorInput.addEventListener("input", saveLayout);

/* Print */

printBtn.addEventListener("click", function () {
    if (photos.length === 0) {
        alert("Please upload at least one photo.");
        return;
    }
    window.print();
});

clearBtn.addEventListener("click", function () {
    if (confirm("Clear all photos?")) {
        photos = [];
        render();
        updatePhotoList();
        saveLayout();
    }
});

/* Save / Load */

function saveLayout() {
    const layout = {
        paperSize: paperSizeInput.value,
        customWidth: customWidth.value,
        customHeight: customHeight.value,
        customUnit: customUnit.value,
        paperOrientation,
        polaroidOrientation,
        spacing: spacingInput.value,
        uniformMargin: uniformMarginCheckbox.checked,
        uniformMarginValue: uniformMarginValue.value,
        marginTop: marginTop.value,
        marginBottom: marginBottom.value,
        marginLeft: marginLeft.value,
        marginRight: marginRight.value,
        cutMarks: cutMarksCheckbox.checked,
        bgColor: bgColorInput.value,
        applyTextToAll: applyTextToAllCheckbox.checked,
        polaroidText: polaroidTextInput.value,
        fontSize: fontSizeInput.value,
        fontFamily: fontFamilyInput.value,
        textAlign: textAlignInput.value,
        textColor: textColorInput.value,
        photos: photos.map(p => ({
            src: p.src,
            name: p.name,
            orientation: p.orientation,
            copies: p.copies,
            text: p.text,
            fontSize: p.fontSize,
            fontFamily: p.fontFamily,
            textAlign: p.textAlign,
            textColor: p.textColor,
            crop: p.crop
        }))
    };
    localStorage.setItem("printVillageLayout", JSON.stringify(layout));
}

function loadLayout() {
    const saved = localStorage.getItem("printVillageLayout");
    if (!saved) return;

    try {
        const layout = JSON.parse(saved);
        paperSizeInput.value = layout.paperSize || "a4";
        customWidth.value = layout.customWidth || "21";
        customHeight.value = layout.customHeight || "29.7";
        customUnit.value = layout.customUnit || "cm";
        setPaperOrientation(layout.paperOrientation || "portrait");
        setPolaroidOrientation(layout.polaroidOrientation || "portrait");
        spacingInput.value = layout.spacing || "0.3";
        uniformMarginCheckbox.checked = layout.uniformMargin !== false;
        uniformMarginValue.value = layout.uniformMarginValue || "0.5";
        marginTop.value = layout.marginTop || "0.5";
        marginBottom.value = layout.marginBottom || "0.5";
        marginLeft.value = layout.marginLeft || "0.5";
        marginRight.value = layout.marginRight || "0.5";
        cutMarksCheckbox.checked = layout.cutMarks || false;
        bgColorInput.value = layout.bgColor || "#ffffff";
        applyTextToAllCheckbox.checked = layout.applyTextToAll || false;
        polaroidTextInput.value = layout.polaroidText || "";
        fontSizeInput.value = layout.fontSize || "16";
        fontFamilyInput.value = layout.fontFamily || "Arial";
        textAlignInput.value = layout.textAlign || "center";
        textColorInput.value = layout.textColor || "#000000";

        if (layout.uniformMargin) {
            uniformMarginGroup.style.display = "block";
            advancedMarginGroup.style.display = "none";
        } else {
            uniformMarginGroup.style.display = "none";
            advancedMarginGroup.style.display = "block";
        }

        if (paperSizeInput.value === "custom") {
            customSizeGroup.style.display = "block";
        }

        photos = (layout.photos || []).map(p => ({
            ...p,
            cropped: null
        }));

        photos.forEach(photo => {
            const img = new Image();
            img.src = photo.src;
            img.onload = function () {
                if (!photo.crop) {
                    generateDefaultCrop(photo, img);
                } else {
                    generateCroppedDataUrl(photo, img);
                }
            };
        });

        render();
        updatePhotoList();
    } catch (e) {
        console.error("Failed to load layout", e);
    }
}

saveBtn.addEventListener("click", function () {
    saveLayout();
    alert("Layout saved!");
});

/* Initial load */

loadLayout();
render();
updatePhotoList();
