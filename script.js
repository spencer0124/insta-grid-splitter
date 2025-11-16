document.addEventListener("DOMContentLoaded", () => {
  // --- v7.0: 모바일 실제 높이 감지 (토스 트릭) ---
  const setAppHeight = () => {
    // 실제 보이는 창의 높이를 CSS 변수로 설정
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--app-height", `${vh}px`);
  };
  // 페이지 로드 시, 창 크기 변경 시 높이 재설정
  window.addEventListener("resize", setAppHeight);
  setAppHeight(); // 최초 실행

  // --- 1. 모든 HTML 요소 가져오기 ---
  const step1Upload = document.getElementById("step-1-upload");
  const step2Options = document.getElementById("step-2-options");
  const step3Result = document.getElementById("step-3-result");
  const uploadButton = document.getElementById("uploadButton");
  const imageLoader = document.getElementById("imageLoader");
  const sourcePreview = document.getElementById("sourcePreview");
  const optionGroup = document.querySelector(".option-group");
  const optionCards = document.querySelectorAll(".option-card");
  const splitButton = document.getElementById("splitButton");
  const gridResultContainer = document.getElementById("gridResultContainer");
  const zipDownloadButton = document.getElementById("zipDownloadButton");
  const restartButton = document.getElementById("restartButton");

  let selectedGrid = "3x3"; // 기본값
  let originalImage = null;
  let generatedPieces = [];

  // --- 2. 함수 정의 ---

  function goToStep(stepToShow) {
    step1Upload.classList.remove("active");
    step2Options.classList.remove("active");
    step3Result.classList.remove("active");
    stepToShow.classList.add("active");
  }

  function splitAndRenderGrid() {
    if (!originalImage) return;

    gridResultContainer.innerHTML = "";
    generatedPieces = [];

    const [cols, rows] = selectedGrid.split("x").map(Number);
    const pieceWidth = originalImage.width / cols;
    const pieceHeight = originalImage.height / rows;

    gridResultContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = Math.ceil(pieceWidth);
    canvas.height = Math.ceil(pieceHeight);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          originalImage,
          c * pieceWidth,
          r * pieceHeight,
          pieceWidth,
          pieceHeight,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const dataUrl = canvas.toDataURL("image/png");
        const name = `image_${r + 1}-${c + 1}.png`;
        generatedPieces.push({ name, data: dataUrl });

        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = name;
        link.title = `클릭해서 ${name} 저장`;
        link.target = "_blank";
        const img = document.createElement("img");
        img.src = dataUrl;
        link.appendChild(img);
        gridResultContainer.appendChild(link);
      }
    }
    goToStep(step3Result);
  }

  async function downloadAllAsZip() {
    if (generatedPieces.length === 0) return;

    zipDownloadButton.disabled = true;
    zipDownloadButton.textContent = "압축 중...";

    const zip = new JSZip();
    for (const piece of generatedPieces) {
      const imageData = piece.data.split(",")[1];
      zip.file(piece.name, imageData, { base64: true });
    }

    const zipContent = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipContent);
    link.download = "insta-grid-images.zip";
    link.click();

    zipDownloadButton.disabled = false;
    zipDownloadButton.textContent = ".zip으로 모두 받기";
  }

  // --- 3. 이벤트 리스너 연결 ---

  uploadButton.addEventListener("click", () => {
    imageLoader.click();
  });

  imageLoader.addEventListener("change", (e) => {
    const file = e.target.files[0]; // v6.0 오타 수정됨
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      originalImage = new Image();
      originalImage.src = event.target.result;
      originalImage.onload = () => {
        sourcePreview.src = event.target.result;
        goToStep(step2Options);
      };
    };
    reader.readAsDataURL(file);
  });

  optionGroup.addEventListener("click", (e) => {
    const selectedCard = e.target.closest(".option-card");
    if (!selectedCard) return;
    optionCards.forEach((card) => card.classList.remove("active"));
    selectedCard.classList.add("active");
    selectedGrid = selectedCard.dataset.grid;
  });

  splitButton.addEventListener("click", splitAndRenderGrid);

  zipDownloadButton.addEventListener("click", downloadAllAsZip);

  restartButton.addEventListener("click", () => {
    originalImage = null;
    generatedPieces = [];
    imageLoader.value = null;
    goToStep(step1Upload);
  });
});
