const Governance = require('../models/governance-model');
const getDb = require('../database/db').getDb;
const userController= require('../controllers/user-controller');
const oracledb = require('oracledb');
const axios = require('axios');


exports.getAssets = (req, res) => {
    const user_email = req.params.user_email;
    Governance.fetchAssets(user_email, req.headers.host)
        .then(result => {
            res.json(result)
        })
        .catch(err => {
            res.json(err)
        })
}


exports.addAssetReviewNote = (req, res) => {
    const review_note = req.body.review_note;
    const asset_status = req.body.asset_status;
    const assetId = req.body.assetId;
    const host=req.headers.host;
    console.log(req.body)
    console.log("Host: "+host);
    if (!review_note || !asset_status) {
        res.json({ "status": "Enter a review note" })
    }
    else {
        Governance.postAssetReviewNote(review_note, asset_status, assetId,host)
            .then(result => {
                console.log("Review submitted. . .");
                if (asset_status === 'Live') {
                    console.log("generating notification. . .");
                    // generateNotification(assetId);
                    res.json({ "status": "The asset has been approved successfully." });
                }
                else if (asset_status === 'Pending Rectification' || asset_status === 'Manager Rectification') {
                    // sendEmailForRectification(assetId);
                    res.json({ "status": "The asset has been sent for rectification with your valuable inputs." })
                    sendEmailForAssetStatusChange(assetId, 'Sent for rectification');
                }
                else if (asset_status === 'Reject') {
                    res.json({ "status": "The asset has been rejected." })
                    sendEmailForAssetStatusChange(assetId, 'Asset have been rejected');

                }
                else if (asset_status === 'manager_approved') {
                    res.json({ "status": "Asset has been sent for 2nd level approval." })
                    sendEmailForAssetStatusChange(assetId, 'Your asset have been approved by manager and submitted for next level of approval');

                }
            })
            .catch(err => {
                console.log("postAssetReviewNote . . . error");
                res.json(err)
            })
    }
}

const sendEmailForAssetStatusChange = (assetId, status) => {
    let AssetTitle;
    let AssetDescription;
    let AssetCreatedBy;
    let AssetCreatedDate;
    let asset_reviewer;
    let asset_owners, asset_owners_managers, owners_managers_combined_list, asset_owners_name;
    getAssetInformatioForEmail(assetId)
        .then(result => {
            const review_comment = JSON.parse(result.rows[0].ASSET_REVIEW_NOTE);
            
                AssetTitle = result.rows[0].ASSET_TITLE;
                AssetDescription = result.rows[0].ASSET_DESCRIPTION;
                AssetCreatedBy = result.rows[0].USER_NAME+"("+result.rows[0].USER_EMAIL+")";
                AssetCreatedDate=result.rows[0].ASSET_CREATED_DATE;

            
            status +=`<br/><h3><u>Asset Information</u></h3><br/><br/><b>Asset Title:</b>${AssetTitle}<br/><b>Asset Description</b>:${AssetDescription}<br/><b>Asset Created By:</b>${AssetCreatedBy}<br/><b>Created On:</b>${AssetCreatedDate}<br/>`;
         
           
        })
        .then(result => {
            getOwnerEmails(assetId)
                .then(result => {
                    if (result.rows.length > 0) {
                        asset_owners = result.rows.map(o => o.USER_EMAIL)
                        asset_owners = asset_owners.join(';')
                        asset_owners_name = result.rows.map(o => o.USER_NAME)
                        asset_owners_name = asset_owners_name.join(';')
                    }
                    else if (result.rows[0] != undefined) {
                        asset_owners = result.rows[0].USER_EMAIL;
                        asset_owners_name = result.rows[0].USER_NAME
                    } else {
                        console.log("no reviewer found to notify");
                        return;
                    }
                    status +="<br/><br/><i>Email will be sent to Owners of the asset "+asset_owners+"<br/><i><b style='color:red'>Note</b>: You have received this email notification because you are one of the owners of this asset.</i>";
                    return asset_owners;
                })
                .then(result => {
                    axios.get('https://apex.oracle.com/pls/apex/agsspace/despatchemail/send', {
                        headers:{
                            mail_subj:`Asset Status changed`,
                            mail_to:`nishant.k.kaushik@oracle.com`,
                            mail_body:status
                        }
                    }).then(
                        ()=>{
                            console.log("EMAIL SENT-------------=============?????");
                        },
                        (err)=>{
                            console.log("FAILED TO SEND EMAIL");
                        }
                    )
                })
        })

}


const getAssetInformatioForEmail = (assetId) => {
    const connection = getDb();
    let rectificationReviewerAndAssetDetailsSql =`select u.user_email,a.ASSET_REVIEW_NOTE,a.asset_owner, u.user_name, u.user_manager_email, a.asset_title,a.asset_created_date, a.ASSET_DESCRIPTION from asset_user u, asset_details a where u.user_email = a.asset_createdby and asset_id=:0`;
    let rectificationReviewerAndAssetDetailsOptions = [];
    rectificationReviewerAndAssetDetailsOptions.push(assetId);
    return connection.execute(rectificationReviewerAndAssetDetailsSql, rectificationReviewerAndAssetDetailsOptions, {
        outFormat: oracledb.OBJECT
    })
}


const getReviewerAndAssetDetails = (assetId) => {
    const connection = getDb();
    let rectificationReviewerAndAssetDetailsSql = `select  user_email,user_name,asset_title,ASSET_DESCRIPTION,ASSET_REVIEW_NOTE from asset_user ,asset_details where user_role='reviewer' and asset_id=:0 and user_location in(
        select user_location from asset_user where user_email in 
        (select distinct regexp_substr(asset_owner,'[^,]+', 1, level) from (select asset_owner from asset_details where asset_id=:0)  where asset_id=:0
        connect by regexp_substr(asset_owner, '[^,]+', 1, level) is not null) and user_location is not null) `;
    let rectificationReviewerAndAssetDetailsOptions = [];
    rectificationReviewerAndAssetDetailsOptions.push(assetId);
    return connection.execute(rectificationReviewerAndAssetDetailsSql, rectificationReviewerAndAssetDetailsOptions, {
        outFormat: oracledb.OBJECT
    })
}

const getOwnerManagerEmail = (assetId) => {
    const connection = getDb();
    let getOwnerManagerSql = `select distinct user_manager_email from asset_user where user_manager_email is not null and user_email in
    (select distinct regexp_substr(asset_owner,'[^,]+', 1, level) from (select asset_owner from asset_details where asset_id=:0)  where asset_id=:0
    connect by regexp_substr(asset_owner, '[^,]+', 1, level) is not null)`;
    let getOwnerManagerOptions = [];
    getOwnerManagerOptions.push(assetId);
    return connection.execute(getOwnerManagerSql, getOwnerManagerOptions, {
        outFormat: oracledb.OBJECT
    })

}

const getOwnerEmails = (assetId) => {
    const connection = getDb();
    let rectificationAssetOwnerSql = `    select user_name,user_email from asset_user where user_email in(
    select regexp_substr(asset_owner,'[^,]+', 1, level) from (select asset_owner from asset_details where asset_id=:0)
    connect by regexp_substr(asset_owner, '[^,]+', 1, level) is not null)`;
    let rectificationAssetOwnerOptions = [];
    rectificationAssetOwnerOptions.push(assetId);
    return connection.execute(rectificationAssetOwnerSql, rectificationAssetOwnerOptions, {
        outFormat: oracledb.OBJECT
    })
}