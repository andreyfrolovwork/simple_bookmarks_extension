// Background service worker для Chrome расширения
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('index.html')
  });
});

// Слушаем изменения закладок для обновления
chrome.bookmarks.onCreated.addListener(() => {
  console.log('Bookmark created');
});

chrome.bookmarks.onRemoved.addListener(() => {
  console.log('Bookmark removed');
});

chrome.bookmarks.onChanged.addListener(() => {
  console.log('Bookmark changed');
});

chrome.bookmarks.onMoved.addListener(() => {
  console.log('Bookmark moved');
});

