const mpdParser = require('mpd-parser');

var FolderName = "Udemy Download/";
var Downloads = [];
var load = {};
var course = {};
var video = {};
video.base = [];
$(document).ready(function () {
  $('.version').text('v' + chrome.runtime.getManifest().version);
  $('title').text(chrome.runtime.getManifest().name + ' v' + chrome.runtime.getManifest().version);
});
const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));
const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

// proto replace turkish char
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-216058552-1']);
_gaq.push(['_trackPageview']);


var Application = {
  init: function () {
    _gaq.push(['_trackEvent', chrome.runtime.getManifest().name + " : Version - " + chrome.runtime.getManifest().version, 'Popup Open']);

    Application.Cookies = [];
    Application.Cookies = {ud_cache_user: ""};
    Application.Domain = localStorage.getItem("corp");
    Application.Popup = localStorage.getItem("popup");
    Application.ShelfDownload = localStorage.getItem("shelf");
    Application.onBuffer = true;

    $('input[name="corp"]').val(Application.Domain);
    $('select[name="shelf"]').val(Application.ShelfDownload);
    console.log(Application.Domain);
    if (Application.Domain === "null") {
      Application.Domain = "www.udemy.com";
    }
    if (Application.ShelfDownload === "true") {
      chrome.downloads.setShelfEnabled(false);
    } else {
      chrome.downloads.setShelfEnabled(true);
    }
    if (Application.Popup !== "false") {
      $('#discord').modal("show");
    }
    $('#discordDontShow').on("click", function (e) {
      e.preventDefault();
      $('#discord').modal("hide");
      Application.Domain = localStorage.setItem("popup", "false");
    });

    $('#corplogin').on("submit", function (e) {
      e.preventDefault();
      localStorage.setItem("corp", $('input[name="corp"]').val());
      localStorage.setItem("shelf", $('select[name="shelf"]').val());
      location.reload();
    });
    chrome.cookies.getAll({
      domain: Application.Domain
    }, function (cookies) {
      for (var i = 0; i < cookies.length; i++) {
        Application.Cookies[cookies[i].name] = cookies[i].value;
      }
      if (Application.Cookies["ud_cache_user"].length > 2) { //login ise
        $('#home').addClass("active");
        $('#login').removeClass("active");
        $(".left-side-menu").prepend(`
                <li class="active">
                        <a data-toggle="pill" href="#home"> <span class="glyphicon glyphicon-home"></span>
                            &nbsp;Home</a>
                    </li>

                    <li>
                        <a data-toggle="pill" href="#down"><span class="glyphicon glyphicon-search"></span>
                            &nbsp;F.A.Q.
                        </a>
                    </li>
                `);
        $('.sonar-wrapper').hide();
        $('.btn-container').show();
        $('#analyze').on("click", function () {
          _gaq.push(['_trackEvent', chrome.runtime.getManifest().name + " : Version - " + chrome.runtime.getManifest().version, 'clicked']);


          chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
            // use `url` here inside the callback because it's asynchronous!
            console.log(tabs);
            if (tabs.url !== undefined) {
              $('.btn-container').hide();
              $(this).prop('disabled', true);
              $(this).text("Analyzing..");
              $('.sonar-wrapper').show();
              $('#total-text').text("Please wait analyzing..");
              setTimeout(() => {
                Application.Course();
              }, 1500);
            } else {
              chrome.tabs.create({
                url: 'https://wooglet.com/udemy-downloader.html'
              });
              window.close();
            }
          });

        });
      } else { // değilse
        $('#home').removeClass("active");
        $('#login').addClass("active");
      }
    });

  },
  Course: function () {
    load.url = "https://" + Application.Domain + "/api-2.0/users/me/subscribed-courses/";
    load.type = "GET";
    load.data = {
      "page_size": 4,
      "ordering": "-last_accessed",
      "fields[course]": "@min,visible_instructors,image_125_H,favorite_time,archive_time,completion_ratio,last_accessed_time,enrollment_time,is_practice_test_course,features,num_collections,published_title,is_private,buyable_object_type",
      "fields[user]": "@min,job_title",
      "page": 1
    };
    var CourseCount = this.uGetApi(load); // get count
    course.type = "CourseList";
    if (CourseCount.count > 100) {
      load.data.page_size = CourseCount.count; // write page size
      course.CourseList = this.uGetApi(load); // get course list
      for (i = 1; i < parseInt((CourseCount.count - 1) / 100) + 1; i++) // 106 2 201 3
      {
        load.data.page = i + 1;
        $.merge(course.CourseList.results, this.uGetApi(load).results); // get course list
      }
    } else {
      load.data.page_size = CourseCount.count; // write page size
      course.CourseList = this.uGetApi(load); // get course list
    }
    Application.sendExtension(course.type, course.CourseList);
  },
  Counter: async function (obj) {
    $('#current-text').show();
    $('#total-text').show();
    $('#current-text').text(obj.Current);
    if (obj.Total) {
      $('#total-text').text(" in " + obj.Total);
    }
  },
  PlayList: async function () {
    video.base = [];
    load.url = "https://" + Application.Domain + "/api-2.0/courses/" + Application.CourseId + "/subscriber-curriculum-items";
    load.type = "GET";
    load.data = {
      "page_size": "1400",
      "fields[lecture]": "title,object_index,is_published,sort_order,created,asset,supplementary_assets,is_free",
      "fields[quiz]": "title,object_index,is_published,sort_order,type",
      "fields[practice]": "title,object_index,is_published,sort_order",
      "fields[chapter]": "title,object_index,is_published,sort_order",
      "fields[asset]": "title,filename,asset_type,status,time_estimation,is_external",
      "caching_intent": "True"
    };
    var getVideoList = this.uGetApi(load);
    video.type = "PlayList";

    VideoIdList = $.grep(getVideoList.results, function (element, index) {
      return (typeof element.asset !== 'undefined') ? (element.asset.asset_type === 'Video') : "";
    });
    var i = 1;
    Application.Counter({"Total": VideoIdList.length});
    await asyncForEach(VideoIdList, async (v, k) => {
      await waitFor(0)
      let temp = {};
      temp.url = "https://www.udemy.com/api-2.0/users/me/subscribed-courses/" + Application.CourseId + "/lectures/" + v.id;
      temp.type = "GET";
      temp.data = {
        "fields[lecture]": "asset,description,download_url,is_free,last_watched_second",
        "fields[asset]": "asset_type,length,media_license_token,course_is_drmed,media_sources,captions,thumbnail_sprite,slides,slide_urls,download_urls,external_url,image_125_H"
      };
      let VideoDetails;
      VideoDetails = Application.uGetApi(temp, {"Current": i});
      if (VideoDetails.length <= 0) {
        let temp = {};
        temp.url = "https://www.udemy.com/api-2.0/users/me/subscribed-courses/" + Application.CourseId + "/lectures/" + v.id;
        temp.type = "GET";
        temp.data = {
          "fields[lecture]": "asset,description,download_url,is_free,last_watched_second",
          "fields[asset]": "asset_type,length,stream_urls,captions,thumbnail_sprite,slides,slide_urls,download_urls,image_125_H"
        };
        VideoDetails = Application.uGetApi(temp, {"Current": i});
        video.base.push({
          "id": v.id,
          "VideoUrl": VideoDetails.asset.stream_urls.Video,
          "VideoTitle": v.object_index + ". " + v.title,
          "VideoThumbnail": ((VideoDetails.asset.thumbnail_sprite != null) ? VideoDetails.asset.thumbnail_sprite.img_url : ""),
          "VideoQuality": VideoDetails.asset.stream_urls.Video[0].label
        });
      } else {
        video.base.push({
          "id": v.id,
          "VideoUrl": VideoDetails.asset.media_sources,
          "VideoTitle": v.object_index + ". " + v.title,
          "VideoThumbnail": ((VideoDetails.asset.thumbnail_sprite != null) ? VideoDetails.asset.thumbnail_sprite.img_url : ""),
          "VideoQuality": VideoDetails.asset.media_sources[0].label
        });
      }
      i++;
    })

    Application.sendExtension(video.type, video.base);
  },
  sendExtension: function (a, b) {
    Application.Core({"Step": a, "Data": b});
  },
  uGetApi: function (data, type = "") {
    const results = $.ajax({
      url: data.url,
      type: data.type,
      "headers": {
        "Content-Type": "application/json, text/plain, */*",
        "x-udemy-authorization": "Bearer " + Application.Cookies["access_token"],
        "x-udemy-cache-brand": Application.Cookies["ud_cache_brand"],
        "x-udemy-cache-campaign-code": Application.Cookies["ud_cache_campaign_code"],
        "x-udemy-cache-device": Application.Cookies["ud_cache_device"],
        "x-udemy-cache-language": Application.Cookies["ud_cache_language"],
        "x-udemy-cache-logged-in": Application.Cookies["ud_cache_logged_in"],
        "x-udemy-cache-marketplace-country": Application.Cookies["ud_cache_marketplace_country"],
        "x-udemy-cache-modern-browser": Application.Cookies["ud_cache_modern_browser"],
        "x-udemy-cache-price-country": Application.Cookies["ud_cache_price_country"],
        "x-udemy-cache-release": Application.Cookies["ud_cache_release"],
        "x-udemy-cache-user": Application.Cookies["ud_cache_user"],
        "x-udemy-cache-version": Application.Cookies["ud_cache_version"]
      },
      async: false,
      data: data.data,
      beforeSend: function () {
      },
      statusCode: {
        200: function (e) {
          Application.Counter(type);
          return e;
        },
        404: function (e) {
          Application.Debug("Api Exception");
        }
      }
    });
    return results.responseJSON;
  },
  GetSprite: function (data, type, full, meta) {
    return (
      '<img src="img_trans.gif" width="1" height="1" style="width:120px; height:67.5px; border:1px solid var(--dark); border: 2px solid var(--dark); background: url(' +
      data +
      ') -120px 0;background-size:400%">'
    );
  },
  GetImg: function (data, type, full, meta) {
    return '<img src="' + data + '" style="border: 2px solid var(--dark);"/>';
  },

  methods: {
    url: "",
    urlList: [],
    isPause: !1,
    isGetMP4: !1,
    durationSecond: 0,
    isShowRefer: !0,
    isComplete: !1,
    downloading: !1,
    beginTime: "",
    errorNum: 0,
    finishNum: 0,
    errorList: [],
    downloadIndex: 0,
    finishList: [],
    tsUrlList: [],
    mediaFileList: [],
    aesConf: {
      method: "",
      uri: "",
      iv: "",
      key: "",
      decryptor: null,
      stringToBuffer: function (e) {
        return (new TextEncoder)
          .encode(e)
      }
    },
    ajax: function (e) {
      e = e || {};
      var i = new XMLHttpRequest;
      "file" === e.type && (i.responseType = "arraybuffer"), i.onreadystatechange = function () {
        if (4 === i.readyState) {
          var t = i.status;
          t >= 200 && t < 300 ? e.success && e.success(i.response) : e.fail && e.fail(t)
        }
      }, i.open("GET", e.url, !0), i.send(null)
    },
    applyURL: function (e, i) {
      if (i = i || location.href, 0 === e.indexOf("http")) return e;
      if ("/" === e[0]) {
        var t = i.split("/");
        return t[0] + "//" + t[2] + e
      }
      var o = i.split("/");
      return o.pop(), o.join("/") + "/" + e
    },
    getM3U8: function () {
      this.fileName = "";
      var e = this;
      this.url ? -1 !== this.url.toLowerCase()
        .indexOf("m3u8") ? this.downloading ? alert("downloading，please wait") : (this.downloading = !0, this.beginTime = new Date, this.ajax({
        url: this.url,
        success: function (i) {
          e.tsUrlList = [], i.split("\n")
            .forEach((function (i) {
              e.isGetMP4 && i.toUpperCase()
                .indexOf("#EXTINF:") > -1 && (e.durationSecond += parseFloat(i.split("#EXTINF:")[1])), i.toLowerCase()
                .indexOf(".ts") > -1 && (e.tsUrlList.push(e.applyURL(i, e.url)), e.finishList.push({
                title: i,
                status: ""
              }))
            })),
            i.indexOf("#EXT-X-KEY") > -1 ? (e.aesConf.method = (i.match(/(.*METHOD=([^,\s]+))/) || ["", "", ""])[2],
              e.aesConf.uri = (i.match(/(.*URI="([^"]+))"/) || ["", "", ""])[2],
              e.aesConf.iv = (i.match(/(.*IV=([^,\s]+))/) || ["", "", ""])[2],
              e.aesConf.iv = e.aesConf.iv ? e.aesConf.stringToBuffer(e.aesConf.iv) : "",
              e.aesConf.uri = e.applyURL(e.aesConf.uri, e.url),
              e.getAES()) : e.tsUrlList.length > 0 ? e.downloadTS() : alert("The resource is empty, please check whether the link is valid")
        },
        fail: function () {
          alert("The resource is empty, please check whether the link is valid")
        }
      })) : alert("The url is error, please  re-enter") : alert("Please input url")
    },
    getMPD: function () {
      this.fileName = "";
      var e = this;
      this.url ? -1 !== this.url.toLowerCase()
        .indexOf("mpd") ? this.downloading ? alert("downloading，please wait") : (this.downloading = !0, this.beginTime = new Date, this.ajax({
        url: this.url,
        success: function (i) {
          e.tsUrlList = [];
          i.split("\n").forEach((function (i) {
            e.isGetMP4 && i.toUpperCase()
              .indexOf("#EXTINF:") > -1 && (e.durationSecond += parseFloat(i.split("#EXTINF:")[1])), i.toLowerCase()
              .indexOf(".ts") > -1 && (e.tsUrlList.push(e.applyURL(i, e.url)), e.finishList.push({
              title: i,
              status: ""
            }))
          }));
            i.indexOf("#EXT-X-KEY") > -1 ? (e.aesConf.method = (i.match(/(.*METHOD=([^,\s]+))/) || ["", "", ""])[2],
              e.aesConf.uri = (i.match(/(.*URI="([^"]+))"/) || ["", "", ""])[2],
              e.aesConf.iv = (i.match(/(.*IV=([^,\s]+))/) || ["", "", ""])[2],
              e.aesConf.iv = e.aesConf.iv ? e.aesConf.stringToBuffer(e.aesConf.iv) : "",
              e.aesConf.uri = e.applyURL(e.aesConf.uri, e.url),
              e.getAES()) : e.tsUrlList.length > 0 ? e.downloadTS() : alert("The resource is empty, please check whether the link is valid")
        },
        fail: function () {
          alert("The resource is empty, please check whether the link is valid")
        }
      })) : alert("The url is error, please  re-enter") : alert("Please input url")
    },
    downloadTS: function () {
      var e = this;
      for (var i = function i() {
        var t = e.isPause,
          o = e.downloadIndex;
        e.downloadIndex++, e.finishList[o] && "" === e.finishList[o].status ? e.ajax({
          url: e.tsUrlList[o],
          type: "file",
          success: function (r) {
            e.dealTS(r, o, (function () {
              return e.downloadIndex < e.tsUrlList.length && !t && i()
            }))
          },
          fail: function () {
            e.errorNum++, e.finishList[o].status = "error",
              e.finishList[o].errorIndex = o,
              e.errorList.push(e.finishList[o]),
            e.downloadIndex < e.tsUrlList.length && !t && i()
          }
        }) : e.downloadIndex < e.tsUrlList.length && !t && i()
      }, t = 0; t < 10; t++) i()
    },
    dealTS: function (e, i, t) {
      var o = this;
      this.conversionMp4(e, i, (function (e) {
        o.mediaFileList[i] = e, o.finishList[i].status = "finish",
          o.finishNum++,
        o.finishNum === o.tsUrlList.length && o.downloadFile(o.mediaFileList, this.fileName),
        t && t()
      }))
    },
    conversionMp4: function (e, i, t) {
      if (this.isGetMP4) {
        var o = new window.muxjs.Transmuxer({
          keepOriginalTimestamps: !0,
          duration: parseInt(this.durationSecond)
        });
        o.on("data", (function (e) {
          if (0 === i) {
            var o = new Uint8Array(e.initSegment.byteLength + e.data.byteLength);
            o.set(e.initSegment, 0),
              o.set(e.data, e.initSegment.byteLength),
              t(o.buffer)
          } else t(e.data)
        })), o.push(new Uint8Array(e)), o.flush()
      } else t(e, i)
    },
    downloadFile: function (e, i) {
      var t = null,
        o = document.createElement("a");
      t = new Blob(e, {
        type: "video/mp4"
      }), o.download = i + ".mp4",
        Application.methods.fileName = URL.createObjectURL(t);
      var temp = {};
      temp = {
        trid: Application.currentData,
        fileurl: Application.methods.fileName,
        foldername:
          FolderName +
          Application.replaceFileName(
            Application.CourseDetail.visible_instructors[0].display_name
          ) +
          "/" +
          Application.replaceFileName(Application.CourseDetail.title) +
          "/",
        filename:
          Application.replaceFileName(Application.methods.videoDetails.VideoTitle) + "_HD.mp4",
      };

      Downloads.push(temp);
      Application.downloadSequentially(Downloads, () => {

        var rows = $("#linkTable").dataTable().$("tr", {filter: "applied"});
        rows
          .find("td")
          .find('[class*="btn-download"]')
          .prop("disabled", false);
        Application.el.text("Re-Download");
        Application.el.removeClass("btn-danger");
        Application.el.removeClass("disabled");
        Application.el.addClass("btn-success");

        Application.el = null;

        var rows = $("#linkTable").dataTable().$("tr", {filter: "applied"});
        var checkboxChecked = rows
          .find("td")
          .find("input")
          .filter("input:checked").length;
        if (checkboxChecked > 0) {
          $("#SelectedVideos").prop("disabled"), false;
        }
      });
      $(':button').prop('disabled', false);

      this.url = "",
        this.urlList = [],
        this.isPause = !1,
        this.isGetMP4 = !1,
        this.durationSecond = 0,
        this.isShowRefer = !0,
        this.isComplete = !1,
        this.downloading = !1,
        this.beginTime = "",
        this.errorNum = 0,
        this.finishNum = 0,
        this.errorList = [],
        this.downloadIndex = 0,
        this.finishList = [],
        this.tsUrlList = [],
        this.mediaFileList = [];
      /*o.style.display = "none", document.body.appendChild(o), o.click(), o.remove(),*/ //
    }
  },
  /* END HD */
  CreateTable: function (obj) {
    $("#example").empty();
    $("#example").append(
      '<table id="linkTable" class="table" cellspacing="0" width="100%"></table>'
    );

    var linkTable = $("#linkTable").DataTable({
      //dom: 'Blfrtip',
      dom: "Blftip",
      data: obj.data,
      rowId: "id",
      ordering: false,
      lengthChange: obj.lengthChange,
      lengthMenu: [5],
      scrollY: 500,
      scrollX: true,
      scrollCollapse: true,
      iDisplayLength: obj.DisplayLength,
      paging: obj.Paging,
      bFilter: true,
      columns: obj.columns,
      buttons: obj.buttons,
      columnDefs: obj.columnDefs,
      language: {
        info: "searched : _TOTAL_ ",
        search: "_INPUT_",
        searchPlaceholder: "Search by name",
        infoFiltered: "in _MAX_",
      },
      initComplete: function () {
        $("#linkTable_length").attr(
          "style",
          "position:relative; display:inline; left:2%;"
        );
        $("#linkTable_length label").attr("style", "padding-top: 5px;");
        $("#linkTable_filter").attr(
          "style",
          "position:absolute; display:inline; right:1.4%;"
        );
        $(".dataTables_scrollBody").attr(
          "style",
          "position: relative; overflow: auto; width: 100%; max-height:472px; height:472px;"
        );
        $(".dataTables_length").addClass("bs-select");
        var rows = $("#linkTable").dataTable().$("tr", {filter: "applied"});
        var checkboxes = rows.find("td").find("input");
        // input onChange event.
        checkboxes.on("change", (i, e) => {
          var checkboxChecked = checkboxes.filter("input:checked").length; //checkbox checked count
          if (checkboxChecked > 0) {
            $("#SelectedVideos").prop("disabled", false);
            $("#SelectAll span").text("Select All");
            $("#SelectedVideos").text(
              "Download " +
              checkboxChecked +
              " " +
              (checkboxChecked === 1 ? "Video" : "Videos")
            );
          } else {
            $("#SelectedVideos").prop("disabled", true);
            $("#SelectedVideos").text("Download Selected Videos");
          }

          if ($(i.target).filter("input:checked").length == 0) {
            $(i.target)
              .parent(0)
              .parent(0)
              .parent(0)
              .removeClass("selected-td");
          } else {
            $(i.target).parent(0).parent(0).parent(0).addClass("selected-td");
          }
        });

        rows
          .find("td")
          .filter('[class*="td-4"]')
          .append(
            "<div class='progress' style='margin-top:3px; height:1.2rem;'><div class='progress-bar' role='progressbar' style='width: 0%; background-color:var(--secondary)!important' aria-valuenow='50' aria-valuemin='0' aria-valuemax='100'>0%</div></div>"
          );
        rows
          .find("td")
          .filter('[class*="td-4"]')
          .find('[class*="progress"]')
          .hide();
      },
    });
    $("#linkTable tbody").on("click", "button", function (e) {
      var data = $(this).parents("tr").attr("id");
      if (Application.Type == "Course") {
        $(".sonar-wrapper").show();
        $("#example").empty();
        $("#counter").show();
        Application.Counter({Current: 0, Total: 0});
        Application.CourseId = data;
        Application.PlayList();
      } else if (Application.Type == "Download") {
        var VideoDetails = $.grep(Application.data, function (v) {
          return v.id == data;
        })[0];
        if ($(this).data("quality")) {
          let label = $(this).data("quality");
          var videoUrl = $.grep(VideoDetails.VideoUrl, function (v) {
            return v.label == label;
          })[0];
          /* HD METHOD */
          if (label === "auto") {
            let el = $(this).parent().parent().find("button");
            el.show();
            $(this).parent().remove();
            el.text("Downloading");
            el.addClass("btn-warning");
            el.addClass("disabled");
            if (videoUrl.fileType === "application/dash+xml") {
              var parsedManifest = mpdParser.parse((videoUrl.file) ? videoUrl.file : videoUrl.src);
              console.log(parsedManifest);
              //$.ajax({
              //    url : (videoUrl.file) ? videoUrl.file : videoUrl.src,
              //    type : "GET",
              //    success:function (e) {
              //        var parsedMpd = mpdParser.parse(e, {
              //            manifestUri: (videoUrl.file) ? videoUrl.file : videoUrl.src
              //        });
              //        console.log("Parse Result : " + parsedMpd);
              //    }
              //})
            } else {
              $.ajax({
                url: (videoUrl.file) ? videoUrl.file : videoUrl.src,
                type: "GET",
                success: function (e) {
                  let parse = e.split("\n");
                  hd_url = parse[(parse.length - 2)];
                  myPromise = new Promise((resolve, reject) => {
                    $(':button').prop('disabled', true);
                    Application.el = el;
                    Application.currentData = data;
                    Application.methods.videoDetails = VideoDetails;
                    Application.methods.url = hd_url;
                    Application.methods.getM3U8();
                    Application.CourseDetail = $.grep(
                      Application.CourseData.Data.results,
                      function (v) {
                        return v.id == Application.CourseId;
                      }
                    )[0];
                    resolve()
                  });
                }
              })
            }
          } else {
            var CourseDetail = $.grep(
              Application.CourseData.Data.results,
              function (v) {
                return v.id === Application.CourseId;
              }
            )[0];
            var temp = {};
            temp = {
              trid: data,
              fileurl: (videoUrl.file) ? videoUrl.file : videoUrl.src,
              fileType: (videoUrl.type) ? videoUrl.type : videoUrl.type,
              foldername:
                FolderName +
                Application.replaceFileName(
                  CourseDetail.visible_instructors[0].display_name
                ) +
                "/" +
                Application.replaceFileName(CourseDetail.title) +
                "/",
              filename:
                Application.replaceFileName(VideoDetails.VideoTitle) + "_" + label + "p.mp4",
            };
            $(this).parent().parent().find("button").show();
            $(this).parent().remove();
            Downloads.push(temp);
            Application.downloadSequentially(Downloads, () => {
              var rows = $("#linkTable").dataTable().$("tr", {filter: "applied"});
              rows
                .find("td")
                .find('[class*="btn-download"]')
                .prop("disabled", false);
              var btnFinishes = $('[class*="btn-download"]:contains(Downloaded)');
              btnFinishes.text("Re-Download");
              btnFinishes.removeClass("btn-danger");
              btnFinishes.addClass("btn-success");

              btnFinishes = null;

              var rows = $("#linkTable").dataTable().$("tr", {filter: "applied"});
              var checkboxChecked = rows
                .find("td")
                .find("input")
                .filter("input:checked").length;
              if (checkboxChecked > 0) {
                $("#SelectedVideos").prop("disabled"), false;
              }
            });
          }
          /* END HD */

        } else {
          $(this).hide();
          let qualityButton = "<div class='row' style='margin-right: 0px; margin-left: 0px;'>";
          $.each(VideoDetails.VideoUrl, function (k, v) {
            if (v.label.toLowerCase() != "auto") {
              qualityButton += "<button class='btn btn-secondary btn-sm btn-success pd-0 btn-download' data-quality='" + v.label + "'>" + v.label + "</button>"
            } else {
              if (v.type == "application/x-mpegURL") {
                qualityButton += "<button class='btn btn-secondary btn-sm btn-success pd-0 btn-download' data-quality='" + v.label + "'>HD</button>";
              }
            }
          });
          qualityButton += "</div>";

          $(this).parent().append(qualityButton);
        }
      } else {
        alert("Malformed data please try again");
      }
    });
  },

  downloadSequentially: function (urls, callback) {
    let index = 0;
    let currentId;
    var trid;
    var videoRowIndex;
    var currentPage;
    chrome.downloads.onChanged.addListener(onChanged);
    next();

    function next() {
      if (index >= urls.length) {
        chrome.downloads.onChanged.removeListener(onChanged);
        callback();
        return;
      }

      const fileurl = urls[index].fileurl;
      const foldername = urls[index].foldername;
      const filename = urls[index].filename;
      trid = urls[index].trid;
      $("#linkTable")
        .dataTable()
        .$("tr", {filter: "applied"})
        .each((k, v) => {
          if (v.id == trid) {
            videoRowIndex = k;
          }
        });
      currentPage = parseInt(
        $(".pagination").find('[class*="active"] a').attr("data-dt-idx")
      );
      currentPage -= 1;

      index++;
      console.log(fileurl);
      if (fileurl) {
        console.log(foldername + filename);
        chrome.downloads.download(
          {
            url: fileurl,
            filename: foldername + filename,
            saveAs: false,
            conflictAction: "overwrite",
          },
          (id) => {
            currentId = id;
          }
        );

      }
    }

    function onChanged({id, state}) {
      if (id === currentId && state && state.current !== "in_progress") {
        // download finish.
        var rows = $("#linkTable").dataTable().$("tr", {filter: "applied"});
        var downloadButton = rows
          .filter("[id*=" + pollProgress.progressBar + "]")
          .find("td")
          .eq(3)
          .find("button");
        var progressBar = rows
          .filter("[id*=" + pollProgress.progressBar + "]")
          .find("td")
          .eq(3)
          .find("div")
          .filter('[class="progress-bar"]');
        var inputChecked = rows
          .filter("[id*=" + pollProgress.progressBar + "]")
          .find("td")
          .eq(0)
          .find("input")
          .filter("input:checked");

        downloadButton.text("Downloaded");
        downloadButton.removeClass("btn-warning");
        downloadButton.addClass("btn-danger");
        progressBar.css("width", "100%");
        progressBar.css("background-color", "var(--warning)");
        progressBar.prop("disabled", true);
        rows
          .filter("[id*=" + pollProgress.progressBar + "]")
          .removeClass("blink");
        Downloads = [];

        if (inputChecked.length == 1) {
          inputChecked.prop("checked", false);
          inputChecked.parent(0).parent(0).parent(0).removeClass("selected-td");

          var rows = $("#linkTable").dataTable().$("tr", {filter: "applied"});
          var checkboxes = rows.find("td").find("input");
          var checkboxChecked = checkboxes.filter("input:checked").length;

          if (checkboxChecked > 0) {
            $("#SelectedVideos").prop("disabled", false);
            $("#SelectedVideos").text(
              "Download " +
              checkboxChecked +
              " " +
              (checkboxChecked === 1 ? "Video" : "Videos")
            );
          } else {
            $("#SelectedVideos").prop("disabled", true);
            $("#SelectedVideos").text("Download Selected Videos");
          }
        }
        next();
      } else if (id === currentId && id > 0) {

        setTimeout(() => {
          pollProgress(id);
        }, 250);

        var rows = $("#linkTable").dataTable().$("tr", {filter: "applied"});
        rows.find("td").find('[class*="btn-download"]').prop("disabled", true);
        $("#SelectedVideos").prop("disabled", true);

        if (currentPage !== parseInt(videoRowIndex / 5)) {
          $("#linkTable")
            .dataTable()
            .fnPageChange(parseInt(videoRowIndex / 5));
        }
      }
    }

    function pollProgress(downId) {
      pollProgress.downId = (downId !== undefined) ? downId : pollProgress.downId;
      pollProgress.tid = -1;
      pollProgress.progressBar = trid;
      pollProgress.videoRowIndex = videoRowIndex;
      pollProgress.currentPage = currentPage;
      chrome.downloads.search(
        {
          id: pollProgress.downId,
        },
        function (items) {
          var options = {
            anyMissingTotalBytes: false,
            anyInProgress: false,
            anyRecentlyCompleted: false,
            anyPaused: false,
            anyDangerous: false,
            totalBytesReceived: 0,
            totalTotalBytes: 0,
          };
          items.forEach(function (item) {
            if (item.state == "in_progress") {
              options.anyInProgress = true;
              if (item.totalBytes) {
                options.totalTotalBytes += item.totalBytes;
                options.totalBytesReceived += item.bytesReceived;

                var dPercent = parseInt(
                  (options.totalBytesReceived / item.totalBytes) * 100
                );
                var rows = $("#linkTable")
                  .dataTable()
                  .$("tr", {filter: "applied"});
                var progressDiv = rows
                  .filter("[id*=" + pollProgress.progressBar + "]")
                  .find("td")
                  .eq(3)
                  .find("div")
                  .filter('[class="progress"]');
                var progressBar = rows
                  .filter("[id*=" + pollProgress.progressBar + "]")
                  .find("td")
                  .eq(3)
                  .find("div")
                  .filter('[class="progress-bar"]');
                var downloadButton = rows
                  .filter("[id*=" + pollProgress.progressBar + "]")
                  .find("td")
                  .eq(3)
                  .find("button");

                // progress tekrar başlar ise, açık ise sıfırla
                if (progressDiv.is(":visible")) {
                  progressDiv.hide();
                  progressBar.prop("disabled", false);
                  downloadButton.removeClass("btn-danger");
                  downloadButton.addClass("btn-warning");
                  progressBar.css("background-color", "var(--warning)");
                }

                // progress kapalıysa aç.
                if (progressDiv.is(":hidden")) {
                  progressDiv.show();
                  progressBar.show();
                  progressBar.css("background-color", "var(--secondary)");

                  downloadButton.prop("disabled", true);
                  downloadButton.text("Downloading");
                  downloadButton.removeClass("btn-success");
                  downloadButton.addClass("btn-warning");
                  progressBar.css("background-color", "var(--warning)");
                }

                // devamlı çalışacak kısım

                progressBar.css("width", dPercent + "%");
                progressBar.text(dPercent + "%");
                rows
                  .filter("[id*=" + pollProgress.progressBar + "]")
                  .addClass("blink");
              } else {
                options.anyMissingTotalBytes = true;
              }
              var dangerous =
                item.danger != "safe" && item.danger != "accepted";
              options.anyDangerous = options.anyDangerous || dangerous;
              options.anyPaused = options.anyPaused || item.paused;
            } else if (
              item.state == "complete" &&
              item.endTime &&
              !item.error
            ) {
              options.anyRecentlyCompleted = options.anyRecentlyCompleted;
            }
          });

          if (options.anyInProgress && pollProgress.tid < 0) {
            pollProgress.start();
          }
        }
      );
    }

    pollProgress.tid = -1;
    pollProgress.MS = 10;

    pollProgress.start = function () {
      if (pollProgress.tid < 0) {
        pollProgress.tid = setTimeout(pollProgress, pollProgress.MS);
      }
    };
  },
  sleep: async function (msec) {
    return new Promise(resolve => setTimeout(resolve, msec));
  },

  Core: function (obj) {
    switch (obj.Step) {
      case "CourseList":
        $("#counter").hide();
        Application.CourseData = obj;
        Application.Type = "Course";
        Application.Paging = true;
        Application.DisplayLength = 5;
        Application.lengthChange = false;
        Application.data = obj.Data.results;

        Application.columns = [
          {
            data: "image_125_H",
            className: "td-1",
            render: Application.GetImg,
          },
          {
            data: "title",
            className: "td-3",
          },
          {
            data: null,
            className: "td-4",
          },
        ];
        Application.buttons = [
          {
            text: "Re-Analyze course list",
            className: "btn-sm btn-danger btn-width-100",
            action: function (e, dt, node, config) {
              $("#example").empty();
              $(".sonar-wrapper").show();
              $("#counter").show();
              $("#message").hide();
              Application.Course();
            },
          },
        ];
        Application.columnDefs = [
          {
            targets: -1,
            data: null,
            className: "minumum",
            defaultContent:
              '<button class="btn btn-secondary btn-sm btn-success" type="button" style="width:100%;"><span>Get Video List</span></button>',
          },
        ];
        $(".sonar-wrapper").hide();
        $(".btn-container").hide();
        Application.CreateTable(Application);
        break;
      case "PlayList":
        $("#counter").hide();
        Application.Type = "Download";
        Application.data = obj.Data;
        Application.Paging = true;
        Application.DisplayLength = 5;
        Application.lengthChange = true;
        Application.columns = [
          /*{
              data: null,
              className: "td-1",
          },*/
          {
            data: "VideoThumbnail",
            render: Application.GetSprite,
            className: "td-2",
          },
          {
            data: "VideoTitle",
            className: "td-3",
          },
          {
            data: null,
            className: "td-4",
          },
        ];
        Application.buttons = [
          {
            text: "&laquo;",
            className: "btn-sm btn-danger btn-width-5 btn-right",
            action: function (e, dt, node, config) {
              $(".sonar-wrapper").show();
              $("#example").empty();
              Application.Course();
            },
          },
          {
            text: "Select All",
            className: "btn-sm btn-danger btn-width-25 btn-right hide", // only single download
            attr: {
              id: "SelectAll",
            },
            action: function (e, dt, node, config) {
              var rows = $("#linkTable")
                .dataTable()
                .$("tr", {filter: "applied"});
              var checkboxes = rows.find("td").find("input"); //all checkboxes
              var checkboxChecked = checkboxes.filter("input:checked").length; //checkbox checked count
              if (checkboxes.length == checkboxChecked) {
                checkboxes.prop("checked", false);
                $("#SelectedVideos").prop("disabled", true);
                $("#SelectAll span").text("Select All");
                $("#SelectedVideos").text("Download Selected Videos");
              } else {
                checkboxes.prop("checked", true);
                $("#SelectAll span").text("DeSelect All");
                $("#SelectedVideos").prop("disabled", false);
                var checkboxChecked = checkboxes.filter("input:checked").length; //checkbox checked count
                $("#SelectedVideos").text(
                  "Download " +
                  checkboxChecked +
                  " " +
                  (checkboxChecked === 1 ? "Video" : "Videos")
                );
              }
            },
          },
          {
            text: "Re-Analyze Videos",
            className: "btn-sm btn-danger btn-width-35 btn-right",
            action: function (e, dt, node, config) {
              $("#example").empty();
              $(".sonar-wrapper").show();
              $("#counter").show();
              $("#message").hide();
              Application.PlayList();
            },
          },
          {
            text: "Download Selected Videos",
            className: "btn-sm btn-success btn-width-35 btn-right hide",
            attr: {
              id: "SelectedVideos",
              disabled: "disabled",
            },
            action: function (e, dt, node, config) {
              $("#linkTable").dataTable().fnPageChange(0);
              Downloads = [];
              var rows = $("#linkTable")
                .dataTable()
                .$("tr", {filter: "applied"});
              rows
                .find("td")
                .find("input")
                .filter("input:checked")
                .each(function (i) {
                  if (this.checked == true) {
                    var data = $(this).parents("td").parents("tr").attr("id");
                    var VideoDetails = $.grep(Application.data, function (v) {
                      return v.id == data;
                    })[0];
                    if (Application.Type == "Course") {
                      $(".sonar-wrapper").show();
                      $("#example").empty();
                      $("#counter").show();
                      Application.Counter({Current: 0, Total: 0});
                      Application.CourseId = data;
                      Application.PlayList();
                    } else if (Application.Type == "Download") {
                      var VideoDetails = $.grep(Application.data, function (v) {
                        return v.id == data;
                      })[0];
                      let data_inspect_quality = $.grep(VideoDetails.VideoUrl, function (v) {
                        return v.label == "auto";
                      })[0];
                      let label = data_inspect_quality.label;
                      var videoUrl = $.grep(VideoDetails.VideoUrl, function (v) {
                        return v.label == label;
                      })[0];
                      if (label === "auto") {
                        console.log("startup");
                        let el = $(this).parent().parent().find("button");
                        el.show();
                        $(this).parent().remove();
                        el.text("Downloading");
                        el.addClass("btn-warning");
                        el.addClass("disabled");
                        myPromise = new Promise((resolve, reject) => {
                          $.ajax({
                            url: (videoUrl.file) ? videoUrl.file : videoUrl.src,
                            type: "GET",
                            success: function (e) {
                              let parse = e.split("\n");
                              hd_url = parse[(parse.length - 2)];
                              $(':button').prop('disabled', true);
                              Application.el = el;
                              Application.currentData = data;
                              Application.methods.videoDetails = VideoDetails;
                              Application.methods.url = hd_url;
                              Application.methods.getM3U8();
                              Application.CourseDetail = $.grep(
                                Application.CourseData.Data.results,
                                function (v) {
                                  return v.id == Application.CourseId;
                                }
                              )[0];
                              //let videoFile = Application.m3u8Download(hd_url);
                            }
                          })
                        });
                        while (Application.methods.downloading) {
                          Application.sleep(100)
                        }
                      } else {
                        var videoUrl = VideoDetails.VideoUrl[0];
                        var CourseDetail = $.grep(
                          Application.CourseData.Data.results,
                          function (v) {
                            return v.id == Application.CourseId;
                          }
                        )[0];
                        var temp = {};
                        temp = {
                          trid: data,
                          fileurl: (videoUrl.file) ? videoUrl.file : videoUrl.src,
                          fileType: (videoUrl.type) ? videoUrl.type : videoUrl.type,

                          foldername: FolderName +
                            Application.replaceFileName(
                              CourseDetail.visible_instructors[0].display_name
                            ) +
                            "/" +
                            Application.replaceFileName(CourseDetail.title) +
                            "/",
                          filename: Application.replaceFileName(VideoDetails.VideoTitle) + "_" + videoUrl.label + "p.mp4",
                        };
                        $(this).parent().parent().find("button").show();
                        $(this).parent().remove();
                        Downloads.push(temp);
                        Application.downloadSequentially(Downloads, () => {
                          var rows = $("#linkTable").dataTable().$("tr", {filter: "applied"});
                          rows
                            .find("td")
                            .find('[class*="btn-download"]')
                            .prop("disabled", false);
                          var btnFinishes = $('[class*="btn-download"]:contains(Downloaded)');
                          btnFinishes.text("Re-Download");
                          btnFinishes.removeClass("btn-danger");
                          btnFinishes.addClass("btn-success");

                          btnFinishes = null;

                          var rows = $("#linkTable").dataTable().$("tr", {filter: "applied"});
                          var checkboxChecked = rows
                            .find("td")
                            .find("input")
                            .filter("input:checked").length;
                          if (checkboxChecked > 0) {
                            $("#SelectedVideos").prop("disabled"), false;
                          }
                        });
                      }
                    }
                  }
                });
            },
          },
        ];
        Application.columnDefs = [
          {
            targets: 0,
            data: null,
            defaultContent: ''
            //'<div style="position:absolute;height:67.5px;"><input type="checkbox" style="position:relative;top: 35%; width:20px; height:20px;"></div>',
          },
          {
            targets: -1,
            data: null,
            className: "minumum",
            defaultContent:
              '<button class="btn btn-secondary btn-sm btn-success pd-0 btn-download" type="button" style="width:100%;"><span>Download</span></button>',
          },
        ];
        $(".sonar-wrapper").hide();
        $(".btn-container").hide();
        Application.CreateTable(Application);
        break;
      default:
        Application.data = null;
        break;
    }
  },
  Debug: function (exception) {
    _gaq.push(['_trackEvent', chrome.runtime.getManifest().name + " : Version - " + chrome.runtime.getManifest().version, exception]);

    console.log(exception);
  },
  espaceRegExp: function (str) {
    return str.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
  },
  replaceAll: function (str, find, replace) {
    return str.replace(
      new RegExp(Application.espaceRegExp(find), "g"),
      replace
    );
  },
  replaceFileName: function (str) {
    var filename = str;
    var invalid = ["\\", "/", ":", "*", "?", '"', "<", ">", "|", "."];
    $.each(invalid, function (key, value) {
      filename = Application.replaceAll(filename, value, "");
    });
    return filename;
  },
};

setTimeout(() => {
  Application.init();
}, 100);
