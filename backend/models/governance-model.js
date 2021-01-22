const getDb = require('../database/db').getDb;
var uniqid = require('uniqid');
const usermodel = require('../models/user-model');
const oracledb = require('oracledb');

exports.fetchAssets = (user_email, host) => {
    const connection = getDb();
    let role;
    return new Promise((resolve, reject) => {
        let checkForReviewerSql = `select USER_ROLE from asset_user where USER_EMAIL=:USER_EMAIL`;
        let checkForReviewerOptions = [user_email]
        let fetchPendingReviewAssetsOptions = [user_email];
        connection.query(checkForReviewerSql, checkForReviewerOptions,
            {
                outFormat: oracledb.OBJECT
            }).then(result => {
                console.log(result)
                if (result.length > 0) {
                    role = result[0].USER_ROLE
                }
                else {
                    resolve({ msg: "User does not exist" })
                }

                let fetchPendingReviewAssetsSql = `select 
                    ASSET_ID,
                    ASSET_TITLE,
                    ASSET_DESCRIPTION,
                    ASSET_USERCASE,
                    ASSET_CUSTOMER,
                    ASSET_CREATEDBY,
                    ASSET_CREATED_DATE,
                    ASSET_SCRM_ID,
                    ASSET_OPP_ID,
                    ASSET_THUMBNAIL,
                    ASSET_MODIFIED_DATE,
                    ASSET_MODIFIED_BY,
                    ASSET_VIDEO_URL,
                    ASSET_EXPIRY_DATE,
                    ASSET_VIDEO_LINK,
                    ASSET_LOCATION,
                    ASSET_OWNER,
                    ASSET_STATUS,
                    ASSET_REVIEW_NOTE
                    from asset_details d,asset_user u where d.asset_createdby = u.user_email and d.asset_status in ('Live','Pending Review','Reject','Pending Rectification','manager_approved','Manager Rectification')`;
                    //and u.USER_EMAIL=:USER_EMAIL`;
                if(role=='manager'){
                    fetchPendingReviewAssetsSql += ` and u.user_manager_email=:USER_EMAIL`;
                     
                }
                else if(role=='vp'){
                    fetchPendingReviewAssetsSql+= ` and user_reporting_lob_leader=:USER_EMAIL`;
                }else if(role=='admin'){
                    fetchPendingReviewAssetsOptions.pop();
                }
                fetchPendingReviewAssetsSql +=` order by d.asset_modified_date desc`;
                //let fetchPendingReviewAssetsOptions = [user_email,user_email];
                
                connection.query(fetchPendingReviewAssetsSql, fetchPendingReviewAssetsOptions,
                    {
                        outFormat: oracledb.OBJECT
                    }).then(result => {
                        result.forEach(element => {
                            element.ASSET_REVIEW_NOTE = JSON.parse(element.ASSET_REVIEW_NOTE)
                        });
                        resolve(formatAssetByStatus(result, host));
                    })



            }).catch(err => {
                reject(err + "Something went Wrong.We'll be back soon")
            })
    })
}

formatAssetByStatus = (result, host) => {
    let pendingReviewList = [];

    let pendingRectificationList = [];

    let rejectList = [];

    let liveList = [];

    let manager_approved = [];

    let managerRectification =[];

    let assetlist = [{
        status: "Pending Review",
        list: pendingReviewList
    }, {
        status: "Pending Rectification",
        list: pendingRectificationList
    }, {
        status: "Reject",
        list: rejectList
    }, {
        status: "Live",
        list: liveList
    },{
        status: "manager_approved",
        list: manager_approved
    },
    {
        status: "Manager Rectification",
        list: managerRectification
    }];

    result.map(asset => {
        asset.ASSET_THUMBNAIL = "http://" + host + "/" + asset.ASSET_THUMBNAIL;
        if (asset.ASSET_STATUS == 'Pending Review') {
            pendingReviewList.push(asset);
        } else if (asset.ASSET_STATUS == 'Pending Rectification') {
            pendingRectificationList.push(asset);
        } else if (asset.ASSET_STATUS == 'Reject') {
            rejectList.push(asset);
        } else if (asset.ASSET_STATUS == 'Live') {
            liveList.push(asset);
        } else if (asset.ASSET_STATUS == 'manager_approved') {
            manager_approved.push(asset);
        }else if (asset.ASSET_STATUS == 'Manager Rectification') {
            managerRectification.push(asset);
        }
    })

    return assetlist;
}


exports.postAssetReviewNote = (review_note, asset_status, assetId, host) => {
    const connection = getDb();
    review_note = JSON.stringify(review_note);
    if (asset_status == 'Live') {
        usermodel.preparenotification(assetId, "Asset", host);
    }

    let insertReviewNoteSql = `UPDATE ASSET_DETAILS SET ASSET_REVIEW_NOTE = :ASSET_REVIEW_NOTE,
    ASSET_STATUS=:ASSET_STATUS where ASSET_ID=:ASSET_ID`;
    let insertReviewNoteOptions = [review_note, asset_status, assetId]
    return new Promise((resolve, reject) => {
        connection.execute(insertReviewNoteSql, insertReviewNoteOptions,
            {
                outFormat: oracledb.OBJECT,
                autoCommit: true
            })
            .then(result => {
                console.log("posted and state: " + asset.ASSET_STATUS);

                resolve(result)
            })
            .catch(err => {
                resolve({})
            })
    })

}