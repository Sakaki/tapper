// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const remote = require('electron').remote;
const {dialog} = require('electron').remote;
const fileManagerBtn = document.getElementById('open-file-button');
const path = require('path');
var fs = require('fs');
var marked = require('marked');
marked.setOptions({
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: true
});
var tabs = 0;

var options = {
  title: 'ファイルを開く',
  filters: [
    { name: 'markdown', extensions: ['md'] },
    { name: 'All Files', extensions: ['*'] }
  ],
  properties: ['openFile', 'multiSelections']
};

var window = remote.getCurrentWindow();
fileManagerBtn.addEventListener('click', function (event) {
  dialog.showOpenDialog(window, options, function (filenames) {
    if (filenames) {
      for (index in filenames) {
        set_markdown_html(filenames[index]);
      }
    }
  });
});

// drag and drop
document.addEventListener('drop', function(e) {
  e.preventDefault();
  e.stopPropagation();
  var files = e.dataTransfer.files;
  for (index in files) {
    set_markdown_html(files[index].path);
  }
});

document.addEventListener('dragover', function(e) {
  e.preventDefault();
  e.stopPropagation();
});

function close_tab(tab_index) {
  console.log(tab_index);
  $('#tab' + tab_index).remove();
  $('#close_' + tab_index).parent().remove();
}

function set_markdown_html(file_path) {
  fs.readFile(file_path, 'utf8', function (err, data) {
    if (err) {
      return console.log(err);
    }
    tabs += 1;
    var file_path_split = file_path.split(path.sep);
    var filename = file_path_split[file_path_split.length - 1].split('.')[0];
    var dirname = file_path.substring(0, file_path.lastIndexOf(filename));
    $('#tab-icons').append('<li class="nav-item"><a class="nav-link" data-toggle="tab" href="#tab' + tabs + '" role="tab">' + filename + ' <i class="fa fa-minus-square close_tab" aria-hidden="true"></i></a></li>');
    // 画像ファイルのパスが存在しない場合、フルパスに変換
    var re = /!\[.*?\]\((.*?)\)/g;
    var match_path;
    do {
      match_path = re.exec(data);
      if (match_path) {
        var image_path_raw = match_path[1];
        if (isFileExists(image_path_raw) == false) {
          // 先頭に付いてる不要な文字列を除去
          var image_name = image_path_raw.replace(/^\.[\/|\\]/g, "");
          data = data.split(image_path_raw).join(dirname + image_name);
        }
      }
    } while (match_path);
    $('#tab-contents').append('<div id="tab' + tabs + '" class="tab-pane fade">' + marked(data) + '</div>');
    $('#tab-icons a[href="#tab' + tabs + '"]').tab('show');
    $('#tab-contents').css('margin-top', $('#tab-icons').height());
  });
}

$(".nav-tabs").on("click", ".close_tab", function () {
  var anchor = $(this).parent();
  $(anchor.attr('href')).remove();
  $(this).parent().remove();
  $(".nav-tabs li").children('a').first().click();
});

// ファイルの存在確認
function isFileExists(file) {
  try {
    fs.statSync(file);
    return true
  } catch(err) {
    if(err.code === 'ENOENT') return false
  }
}

set_markdown_html('README.md');
