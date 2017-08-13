'use strict';

// Repository full_name array
let full_names = []


// Set Access TOKEN
const button = document.getElementById('Button')
button.addEventListener('click', function(){
  const input = document.getElementById('Input').value
  chrome.storage.sync.set({'token': input});
})


// Keyup
let keyup_stack = []
const keyword = document.getElementById('Search')
keyword.addEventListener('keyup', function(){
  keyup_stack.push(1)
  setTimeout(function(){
    keyup_stack.pop()
    if (keyup_stack.length === 0) {
      searchRepositories(this.value)
    }
  }.bind(this), 300)
})

const searchRepositories = (word) => {
  var buf = '.*' + word.replace(/(.)/g, '$1.*')
  var reg = new RegExp(buf);
  const list = full_names.filter((d) => {
    return reg.test(d)
  })


  // NOTE: It's not "for in" :)
  const ul = document.getElementById('Ul')
  // NOTE: I think it's better than removeChild.
  ul.innerHTML = ''
  for (const repo of list) {
    appendLink(repo, ul)
  }
}

var appendLink = (repo, ul) => {
  const li = document.createElement('li')
  li.innerHTML = '<span data-repo="' + repo + '">' + repo + '</span>'
  ul.appendChild(li)

  // TODO: I wanna move this logic to another method.
  const repos = document.querySelectorAll('[data-repo]')
  Array.from(repos).forEach(repo => {
    repo.addEventListener('click', function(event) {
      event.preventDefault();
      console.log(this.dataset.repo);
      const full_name = this.dataset.repo

      // NOTE: 新しいタブが開く
      chrome.tabs.create({ url: 'https://github.com/' + full_name + '/'})
    });
  });
}



// DOMContentLoaded
document.addEventListener('DOMContentLoaded', function(e) {

  var token
  chrome.storage.sync.get('token', function(v){
    token = v.token
    setCode(token)
    let last_page = 1

    asyncGetRequest(token).then((xhr) => {
      const link = xhr.getResponseHeader('link')
      last_page =  Number(link.replace(/^.*&page=(\d).*$/, '$1'))
      return last_page
    }).then((last_page) => {
      let promises = []

      for (let i=1; i<last_page+1; i++) {

        // It's not correct order...
        promises.push(asyncGetRequestWithPage(token, i).then((xhr) => {
          const ary = JSON.parse(xhr.responseText)
          for (const v of ary) {
            full_names.push(v.full_name)
          }
        }));
      } // end for

      Promise.all(promises).then(() => {
        console.log(full_names);
      })

    })
  });

  // Set code value to DOM
  var setCode = (code) => {
    document.getElementById('Code').innerText = code
  }

  // Oh God, Promise :)
  const asyncGetRequest = (token) => {
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest()
      xhr.open('GET', 'https://api.github.com/user/repos?per_page=100')
      xhr.setRequestHeader('Authorization', 'token ' + token);
      xhr.onload = () => resolve(xhr)
      xhr.send()
    })
  }

  const asyncGetRequestWithPage = (token, page) => {
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest()
      xhr.open('GET', 'https://api.github.com/user/repos?per_page=100' + '&page=' + String(page))
      xhr.setRequestHeader('Authorization', 'token ' + token);
      xhr.onload = () => resolve(xhr)
      xhr.send()
    })
  }

});
