function request(url) {
  return new Promise((resolve, reject) => {
    var XHR = ("onload" in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
    var xhr = new XMLHttpRequest();

    xhr.open('POST', url, true);
    xhr.send();

    xhr.onreadystatechange = function() {
      if (this.readyState != 4) return;
      if (this.status != 200) {
        var error = new Error(this.statusText);
        error.code = this.status;
        reject(error);
      }
      resolve(JSON.parse(xhr.responseText))
    }
  })
}


function requestLoop() {
  request('https://data-live.flightradar24.com/zones/fcgi/feed.js?bounds=56.84,55.27,33.48,41.48')
    .then(
      (res) => {
        processResponse(res, render)
        return
      },
      (err) => {
        alert(`Rejected: ${error}`)
        return
      })
    .then(() => {
      setTimeout(function () {
        requestLoop()
      }, 5000);
    })
}


function processResponse(data, cb) {
  var list = []

  for (k in data) {
    if (!Array.isArray(data[k])) continue
    list.push(data[k])
    // Положил сюда длину дуги от самолета до аэропорта домодедово
    // data[k].push(calculateArcLength({latitude: data[k][1], longitude: data[k][2]}))
  }

  list.sort(function(a, b) {
    aArcLength = calculateArcLength({latitude: a[1], longitude: a[2]})
    bArcLength = calculateArcLength({latitude: b[1], longitude: b[2]})
    return aArcLength - bArcLength
  })

  cb(list)
}


function render(list) {
  var parentElem = document.body
  var table = document.createElement('div')

  table.className = 'table table-body'

  for (var i = 0; i < list.length; i++) {
    var el = document.createElement('div')
    var arr = list[i]

    el.className = 'tr'

    el.appendChild(addCell('coords', `${arr[1]}&deg;<br />${arr[2]}&deg`))
    el.appendChild(addCell('speed', `${Math.floor(arr[5]*1.852000)}`))
    el.appendChild(addCell('direction', `${arr[3]}&deg;`))
    el.appendChild(addCell('height', `${Math.floor(arr[4]/3.2808)}`))
    el.appendChild(addCell('departure', arr[11]))
    el.appendChild(addCell('arrival', arr[12]))
    el.appendChild(addCell('flight', arr[13]))

    // Вывожу расстояние от самолёта до аэропорта Домодедово
    // el.appendChild(addCell('', list[i][list[i].length - 1]))

    table.appendChild(el)
  }

  removeTableBody(parentElem, function() {
    parentElem.appendChild(table)
  })
}


function removeTableBody(parent, cb) {
  var body = document.querySelector('.table-body')
  if (body !== null) parent.removeChild(body)
  cb()
}


function addCell (className, content) {
  var el = document.createElement('div')
  el.className = `td td-${className}`
  el.innerHTML = content
  return el
}


function addTitle (cb) {
  var arr = [
    ['coords', 'Координаты'],
    ['speed', 'Скорость (км/ч)'],
    ['direction', 'Направление самолёта'],
    ['height', 'Высота (метры)'],
    ['departure', 'Код вылета'],
    ['arrival', 'Код назначения'],
    ['flight', 'Номер рейса']
  ]

  var table = document.createElement('div')
  var el = document.createElement('div')

  table.className = 'table table-title'
  el.className = 'tr'

  for (var i = 0; i < arr.length; i++) {
    el.appendChild(addCell(arr[i][0], arr[i][1]))
  }

  table.appendChild(el)
  document.body.appendChild(table)

  cb()
}


function calculateArcLength(coords) {
  const averageRadiusEarth = 6371
  const coordsDomodedovo = {
    latitude: 55.410307,
    longitude: 37.902451
  }
  return Math.floor(averageRadiusEarth * Math.acos(Math.sin(coordsDomodedovo.latitude) * Math.sin(coords.latitude) + Math.cos(coordsDomodedovo.latitude) * Math.cos(coords.latitude) * Math.cos(coordsDomodedovo.latitude - coords.latitude)))
}


document.addEventListener('DOMContentLoaded', function() {
  addTitle(requestLoop)
});
