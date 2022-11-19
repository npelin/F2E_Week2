var page3Files = [];
var page = 1;
var PDFJS = window['pdfjs-dist/build/pdf'];
var BASE64_MARKER = ';base64,';
function loadingBG() {
    if (page == 1) {
        if ($(window).width() >= 768) {
            $(".loadingContent .loadingBG").attr('src', './img/cover-lg.png');
        }
        if ($(window).width() < 768) {
            $(".loadingContent .loadingBG").attr('src', './img/cover-sm.png');
        }
    }
}
function Page1Fun() {
    if (page == 1) return;
    page = 1;
    $.each(".pages,.footbar".split(","), function (i, v) {
        $(v).hide();
    });
    $(".page1").show();
    $(".signNew").show();
}
function Page2Fun() {
    if (page == 2) return;
    page = 2;
    $.each(".pages,.signNew".split(","), function (i, v) {
        $(v).hide();
    });
    $(".page2").show();
    $(".footbar").show();
}
function Page3Fun() {
    if (page == 3) return;
    if ($(".toPage3").hasClass("disabled")) return;
    page = 3;
    Page3Config();
    $.each(".pages,.signNew".split(","), function (i, v) {
        $(v).hide();
    });
    $(".page3").show();
    $(".footbar").show();
}
function Page4Fun() {
    if (page == 4) return;
    page = 4;
    $.each(".pages,.signNew".split(","), function (i, v) {
        $(v).hide();
    });
    $(".page4").show();
    $(".footbar").show();
}
function convertDataURIToBinary(dataURI) {
    var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    var base64 = dataURI.substring(base64Index);
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));
    for (var i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }
    return array;
}
function Page3Config() {
    let id = $(".line.active").data('id');
    let currentFile = page3Files[id];
    $(".page3FileName").html(currentFile.fileName);
    ShowPage3PDF(currentFile.imgResult);
}
function ShowPage3PDF(result) {
    $(".showPdf").html('');
    PDFJS.getDocument(convertDataURIToBinary(result)).promise.then(function (pdf) {
        for (var pageNum = 1; pageNum <= pdf.numPages; ++pageNum) {
            pdf.getPage(pageNum).then(function (page) {
                var scale = 1.5;
                var viewport = page.getViewport({ scale: scale });
                // Prepare canvas using PDF page dimensions
                var canvas = document.createElement('canvas');
                var context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                // Render PDF page into canvas context
                var renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                var renderTask = page.render(renderContext);
                renderTask.promise.then(function () {
                    //console.log('Page rendered');
                });
                $(".showPdf").append(canvas);
            });
        }
    });
}
function NewDiv(msg) {
    let newItem = document.createElement('div');
    newItem.innerHTML = msg;
    return newItem;
}
function ShowFileList() {
    $(".list > .line").remove();
    var line = NewDiv('');
    line.className = "line lineHeader";
    line.append(NewDiv("名稱"));
    line.append(NewDiv("上傳時間"));
    line.append(NewDiv("上次開啟"));
    $(".list").append(line);
    $.each(page3Files, function (index, item) {
        var line = NewDiv('');
        line.className = "line";
        line.dataset.id = index;
        line.append(NewDiv(item.fileName));
        line.append(NewDiv(item.uploadTime));
        line.append(NewDiv(item.lastOpenTime));
        $(".list").append(line);
    });
}
//----------------------------------PDF----------------------------------------
const fileMaxSize = 10 * 1024 * 1024;//10MB
const imageType = /\*.pdf/;
function handleFileSelect(e) {
    e.stopPropagation();
    e.preventDefault();
    const fileUploader = document.getElementById("fileUploader");
    fileUploader.click();
}
function dragenter(e) {
    e.stopPropagation(); //終止事件傳導
    e.preventDefault(); //終止預設行為
}
function dragover(e) {
    e.stopPropagation(); //終止事件傳導
    e.preventDefault(); //終止預設行為
}
function drop(e) {
    e.stopPropagation(); //終止事件傳導
    e.preventDefault(); //終止預設行為
    const dt = e.dataTransfer;
    const files = dt.files; // 取得被拖曳的圖片
    handleFiles(files);
}
function fileVaild(file) {
    if (file.size > fileMaxSize) return false;
    return true;
}
function getNow() {
    let d = new Date();
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}, ${d.getHours()}:${d.getMinutes()}`;
}
async function handleFiles(files) {
    console.log(files);
    let isVaild = true;
    $.each(files, function (index, item) {
        if (!fileVaild(item)) {
            isVaild = false;
            return;
        }
    });
    if (!isVaild) {
        alert('檔案過大');
        return;
    }
    for (var i = 0; i < files.length; i++) {
        const file = files[i];
        const newItem = {
            fileName: file.name,
            uploadTime: getNow(),
            lastOpenTime: "--",
            imgResult: null
        };
        page3Files.push(newItem);
        const reader = new FileReader();
        reader.onload = (e => {
            newItem.imgResult = e.target.result;
            localStorage.setItem('week2_files', JSON.stringify(page3Files));
        });
        reader.readAsDataURL(file);
    }
}
const dropbox = document.getElementById("page2UploadBlock");
dropbox.addEventListener("dragenter", dragenter, false);
dropbox.addEventListener("dragover", dragover, false);
dropbox.addEventListener("drop", drop, false);
dropbox.addEventListener("click", handleFileSelect, false);
//----------------------------------PDF----------------------------------------
