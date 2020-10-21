const getDb = require('../database/db').getDb;
let fs = require('fs');
let uniqid = require('uniqid');
const oracledb = require('oracledb');
oracledb.fetchAsString = [oracledb.CLOB];
let log = require('log4js').getLogger("user-model");
let path = require('path');
let base64 = require('base-64');
const axios = require('axios');

exports.triggerEmailNotificationforRequestDemo = (request) => {
    var body = `Q&D Team,<br/><br/>There is a request for demo on asset ${request.asset_name} by user ${request.name}.<br/><br/>Provided below are the details:<br/>Asset ID: ${request.assetid}<br/>Requester Email: ${request.email}<br/>Requester Name: ${request.name}<br>Contact No:  ${request.mobile ? request.mobile : 'N/A'}<br/>Location: ${request.location ? request.location : 'N/A'}<br/>Pillar: ${request.pillar ? request.pillar : 'N/A'}<br/>Opp ID: ${request.request_opportunity_id}<br/>Customer Name: ${request.request_demo_customer_name ? request.request_demo_customer_name : 'N/A'}<br/>Demo Date: ${request.request_demo_date ? request.request_demo_date : 'N/A'}<br/>Notes: ${request.request_demo_note ? request.request_demo_note : 'N/A'}<br/><br/>Please process this request and engage the appropriate team to help qualify and support this request.<br/><br/>Dear ${request.name},<br/><br/>Your request will be processed as soon as possible and you will be contacted with next steps.<br/><br/>Please note: This is a system generated message. Please do not respond to this mail.`
    //console.log(body);
    //return new Promise((resolve, reject) => {
        axios.get('https://apex.oracle.com/pls/apex/agsspace/despatchemail/send', {
                headers:{
                    mail_subj:`Request for demo on asset ${request.asset_name} with asset ID ${request.assetid}`,
                    mail_to:`nishant.k.kaushik@oracle.com`,
                    mail_body:body
                }
        }).then(res => {
            console.log('Email Sent');
            
        },(err)=>{
            console.log("Fail - Email process");
        }
        )
   // });
}
exports.triggerEmailNotificationforSEAssistance = (request) => {
    var body = `Q&D Team,
    <br/><br/>There is a request for SE Assistance on win ${request.winstory_name} by user ${request.name}.
    <br/><br/>Provided below are the details:    
    <br/>Win ID: ${request.winstoryid}
    <br/>Requester Email: ${request.email}
    <br/>Requester Name: ${request.name}
    <br/>Contact No:  ${request.mobile ? request.mobile : 'N/A'}
    <br/>Location: ${request.location ? request.location : 'N/A'}
    <br/>Pillar: ${request.pillar ? request.pillar : 'N/A'}
    <br/>Opp ID: ${request.request_opportunity_id} 
    <br/>Customer Name: ${request.se_assistance_customer_name ? request.se_assistance_customer_name : 'N/A'}
    <br/>Demo Date: ${request.se_assistance_date ? request.se_assistance_date : 'N/A'} 
    <br/>Notes: ${request.se_assistance_note ? request.se_assistance_note : 'N/A'} 
    <br/><br/>Please process this request and engage the appropriate team to help qualify and support this request.    
    <br/><br/>Dear ${request.name},
    <br/><br/>Your request will be processed as soon as possible and you will be contacted with next steps.
    <br/><br/>Please note: This is a system generated message. Please do not respond to this mail.`
    //console.log(body);
    return new Promise((resolve, reject) => {
        axios.put('https://apex.oracle.com/pls/apex/ldap_info/get/send_email', {
            "from_email": request.email,
            "to_email": `veronica.t.taing@oracle.com,samdani.shaik@oracle.com,jack.kingsley@oracle.com,qualification-dispatch_in_grp@oracle.com,${request.WINSTORY_CREATED_BY},${request.email}`,
            "body1": body,
            "body_html": body,
            "subject": `Request for SE Assistance on win ${request.winstory_name} with Win ID ${request.winstoryid}`
        }).then(res => {
            console.log('Email Sent');
            resolve('Email Sent')
        })
    });
}
exports.triggerEmailNotificationforFeedback = (request) => {
    console.log(JSON.stringify(request));
    var body = `Hi,
    <br/><br/>There is a Feedback on asset ${request.assetId} by user ${request.commentByUserName}.
    <br/><br/> Provided below are the details:
    <br/>Asset ID: ${request.assetId} 
    <br/>Feedback Provided By: ${request.commentBy}
    <br/>Feedback: ${request.comment}
    <br/><br/>Please note: This is a system generated message. Please do not respond to this mail.`

    let reqbody={
        "from_email": request.commentBy,
        "to_email": request.asset_owner,
        "body1": body,
        "body_html": body,
        "subject": `Feedback on asset ${request.assetId} with asset ID ${request.assetId}`
    }
    console.log(" RE BODY : -> "+JSON.stringify(reqbody));
    return new Promise((resolve, reject) => {
        axios.put('https://apex.oracle.com/pls/apex/ldap_info/get/send_email', reqbody).then(res => {
            console.log('Feedback email Sent');
            resolve('Feedback email Sent');
        })
    });
}

exports.notificationForWinStoryComment = (request) => {
    console.log(JSON.stringify(request));
    //WINSTORY_CUSTOMER_NAME, WINSTORY_FISCAL_QUARTER
    var body = `Hi,
    <br/><br/>There is a comment on the win ${request.winstoryId} by user ${request.commentByUserName}.
    <br/><br/> Provided below are the details:
    <br/>Customer Name : ${request.winstory_customer_name} 
    <br/>Win Fiscal Quarter: ${request.winstory_fiscal_quarter}
    <br/>Commented By: ${request.commentBy} 
    <br/>Comment: ${request.comment} 
    <br/><br/>Please note: This is a system generated message. Please do not respond to this mail.`

    let reqbody = {
        "from_email": request.commentBy,
        "to_email": 'NACLOUDWINS_US@ORACLE.COM',
        "body1": body,
        "body_html": body,
        "subject": `Comment on win id ${request.winstoryId}`
    }
    console.log(JSON.stringify(reqbody));
    return new Promise((resolve, reject) => {
        axios.put('https://apex.oracle.com/pls/apex/ldap_info/get/send_email', reqbody).then(res => {
            console.log('Winstory comment email Sent ');
            resolve('Winstory comment email Sent');
        })
    });
}

//Send email to manager for approval
exports.notificationToManagerForApproval = async(info)=>{
    var body=`Hello,<br/>A new asset created by <b>${info.asset_created_by_name}</b> is waiting in your bucket for approval.<br/><b>Below are few more details about the asset:</b><br/><br/><b>Asset Title:</b>${info.asset_title}<br/><b>Asset Description:</b>${info.asset_description}<br/><b>Owners:</b>${info.asset_owners_name}<br/><b>Owners Email:</b>${info.asset_owners_email}<br/><br/><i>Email will be sent to manager for approval, manager email - ${info.manager}`;
    try{
        await axios.get('https://apex.oracle.com/pls/apex/agsspace/despatchemail/send', {
            headers:{
                mail_subj:`Approval Requied - ${info.asset_title}`,
                mail_to:`nishant.k.kaushik@oracle.com`,
                mail_body:body
            }
        })
        console.log("EMAIL SENT");
    }
    catch(e){
        console.log("Unable to send email");
    }
}


//Send email to asset owner after manager approves or reject the asset approval request
exports.notificationToOwnerFromManager = async(request)=>{
    var body=`Hi `;
    try{
        await axios.get('https://apex.oracle.com/pls/apex/agsspace/despatchemail/send', {
            headers:{
                mail_subj:`Request for demo on asset ${request.asset_name} with asset ID ${request.assetid}`,
                mail_to:`${request.asset_owner},${request.email}`,
                mail_body:body
            }
        })
        console.log("EMAIL SENT");
    }
    catch(e){
        console.log("Unable to send email");
    }
}


//Send email to senior manager to approve
exports.notificationToSeniorManagerForApproval = async(request)=>{
    var body=`Hi `;
    try{
        await axios.get('https://apex.oracle.com/pls/apex/agsspace/despatchemail/send', {
            headers:{
                mail_subj:`Request for demo on asset ${request.asset_name} with asset ID ${request.assetid}`,
                mail_to:`${request.asset_owner},${request.email}`,
                mail_body:body
            }
        })
        console.log("EMAIL SENT");
    }
    catch(e){
        console.log("Unable to send email");
    }
}


//Send email to owner AfterApprovedOrRejectedBySeniorManager
exports.notificationToOwnerAfterApprovedOrRejectedBySeniorManager = async(request)=>{
    var body=`Hi `;
    try{
        await axios.get('https://apex.oracle.com/pls/apex/agsspace/despatchemail/send', {
            headers:{
                mail_subj:`Request for demo on asset ${request.asset_name} with asset ID ${request.assetid}`,
                mail_to:`${request.asset_owner},${request.email}`,
                mail_body:body
            }
        })
        console.log("EMAIL SENT");
    }
    catch(e){
        console.log("Unable to send email");
    }
}