/**
 * Created by gamer on 2015/7/15.
 */

var wxpluginApp = angular.module('wxpluginApp', []);

wxpluginApp.controller('loginController', ['$scope', '$http', function ($scope, $http) {
    $scope.qrcodeUrl='/images/login_replace.png';
    $scope.userAvatar='/images/login_replace.png';

    // go get the qrcode url
    $http.get('/qrcode').success(function (response) {
        // temp data.
        //$scope.uuid = '12345678';
        $scope.uuid = response;
        $scope.qrcodeUrl = 'https://login.weixin.qq.com/qrcode/' + $scope.uuid;

        // keep checking if user was scan and confirmed
        checkIfScanAndConfirmed();
    });


    function checkIfScanAndConfirmed() {
        $http.get('/login/' + $scope.uuid).success(function (response) {
            console.log("Check if player was login : " + response);

            if(typeof(response) == 'string'){
                if(response.indexOf('window.code=408') !=-1){
                    checkIfScanAndConfirmed();
                }else if(response.indexOf('window.code=201') !=-1){
                    //$scope.userAvatar = response.substr(response.indexOf('userAvatar') + 12);
                    $scope.userAvatar = response.substring(response.indexOf('userAvatar') + 14 , response.lastIndexOf("'"));
                    // check if user was confirmed.
                    checkIfScanAndConfirmed();
                }
            } else{
                // here suppose be json file.
                // console.log(response);

                $scope.pass_ticket = response.error.pass_ticket[0];
                $scope.skey = response.error.skey[0];
                $scope.wxsid= response.error.wxsid[0];
                $scope.wxuin= response.error.wxuin[0];

                webwxinit();
            }
        });
    }

    function webwxinit(){

        var payload ={
            BaseRequest:{
                DeviceID: 'e965569521998987',
                Sid: $scope.wxsid,
                Skey: $scope.skey,
                Uin: $scope.wxuin
            }
        };
        $http.post('/init/'+ $scope.pass_ticket, payload).success(function (response) {
            console.log(response);
            $scope.wxinit = response;
            $scope.contactList = response.ContactList;
            $scope.user = response.User;
            $scope.UserName = $scope.user.UserName;
            $scope.SyncKey = response.SyncKey;

            console.log($scope.UserName);
            //console.log($scope.user.NickName);
            //console.log($scope.contactList);


            webwxstatusnotify();
        });
    }


    function webwxstatusnotify(){
        var payload={
            BaseRequest:{
                DeviceID: 'e965569521998987',
                Sid: $scope.wxsid,
                Skey: $scope.skey,
                Uin: $scope.wxuin
            },
            ClientMsgId: new Date().getTime(),
            Code:3,
            FromUserName: $scope.UserName,
            ToUserName: $scope.UserName
        };

        $http.post('/webwxstatusnotify/'+ $scope.pass_ticket, payload).success(function (response) {
            console.log(response);

            // actually I don't need this...
            webwxgetcontact();
        });
    }

    function webwxbatchgetcontact(){
        var contacts =[];


        console.log($scope.contactList.length);

        for( i=0; i< $scope.contactList.length; i++){
            if($scope.contactList[i].UserName!="filehelper"){
                contacts.push({
                    ChatRoomId: "",
                    UserName: $scope.contactList[i].UserName
                });
            }
        }

        var count = contacts.length;

        console.log(count);

        //var req = {
        //    method : 'POST',
        //    url: '/webwxbatchgetcontact/' + $scope.pass_ticket,
        //    data:{
        //        BaseRequest:{
        //            DeviceID: 'e965569521998987',
        //            Sid: $scope.wxsid,
        //            Skey: $scope.skey,
        //            Uin: $scope.wxuin
        //        },
        //        Count: contacts.length,
        //        List: contacts
        //    }
        //};
        //
        //$http.post(req).success(function(response){
        //    console.log(response);
        //});

        var payload={
            BaseRequest:{
                DeviceID: 'e965569521998987',
                Sid: $scope.wxsid,
                Skey: $scope.skey,
                Uin: $scope.wxuin
            },
            Count: contacts.length,
            List: contacts
        };

        $http.post('/webwxbatchgetcontact/'+ $scope.pass_ticket, payload).success(function (response) {
            console.log(response);

            // actually I don't need this...
            webwxgetcontact();
        });

    }

    function webwxgetcontact(){
        //$http.get('https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact?pass_ticket='+$scope.pass_ticket +'&r='+ new Date().getTime() +'&skey='+$scope.skey).success(function (response) {
        //    console.log(response);
        //});


        $http.get('/webwxgetcontact',{params:{
            pass_ticket: $scope.pass_ticket,
            skey: $scope.skey
        }}).success(function(response){

            $scope.contact = response;

            // filter out the group information
            console.log($scope.contact.MemberCount);

            $scope.groupContact = [];

            for(i= 0 ;i< $scope.contact.MemberCount; i++){
                if($scope.contact.MemberList[i].UserName.indexOf('@@') !=-1){
                    $scope.groupContact.push($scope.contact.MemberList[i]);
                }
            }

            console.log($scope.groupContact);


            //console.log('Get contact here...');
            //console.log(response);

        });
    }


    $scope.Send = function () {
        console.log($scope.msg.chat_content);
    }



}]);
