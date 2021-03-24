import { Contract } from 'near-api-js'

import getConfig from './config'
import { initContract, login, logout } from './utils'

import 'regenerator-runtime/runtime'

const nearConfig = getConfig(process.env.NODE_ENV || 'development')

const { networkId } = getConfig(process.env.NODE_ENV || 'development')

// global variable used throughout

const commentInputElement = document.querySelector('input#comment');

document.querySelector('#sign-in-button').onclick = login
document.querySelector('#sign-out-button').onclick = logout

let memeList = [];
const memeContracts = [];

const memeListButton = document.querySelector('#meme-list-button');
const memeListLabel = document.querySelector('#meme-list-label');

const memeContractsInitButton = document.querySelector('#meme-contracts-init-button');
const memeContractsInitLabel = document.querySelector('#meme-contracts-init-label');

const memeShowButton = document.querySelector('#show-memes-button');

const memeWriteCommentButton =  document.querySelector('#submit-comment-button');
const getRecentCommentsButton =  document.querySelector('#get-recent-comments-button');

const memeSelectElement = document.getElementById('meme-select');
const submitCommentSelectElement = document.getElementById('submit-comment-select');
const recentCommentSelectElement = document.getElementById('recent-comments-select');
const commentsContainer = document.getElementById('recent-comments-container');

const memeTextElement = document.getElementById('meme-text');

memeListButton.onclick = getMemeList;
memeContractsInitButton.onclick = initMemeContracts
memeShowButton.onclick = showMeme
memeWriteCommentButton.onclick = writeCommentToMeme
getRecentCommentsButton.onclick = getRecentComments;

// Display the signed-out-flow container
function signedOutFlow() {
  document.querySelector('#signed-out-flow').style.display = 'block'
}

// Displaying the signed in flow container and fill in account-specific data
function signedInFlow() {
  document.querySelector('#signed-in-flow').style.display = 'block'

  document.querySelectorAll('[data-behavior=account-id]').forEach(el => {
    el.innerText = window.accountId
  })

  // populate links in the notification box
  const accountLink = document.querySelector('[data-behavior=notification] a:nth-of-type(1)')
  accountLink.href = accountLink.href + window.accountId
  accountLink.innerText = '@' + window.accountId
  const contractLink = document.querySelector('[data-behavior=notification] a:nth-of-type(2)')
  contractLink.href = contractLink.href + window.contract.contractId
  contractLink.innerText = '@' + window.contract.contractId

  // update with selected networkId
  accountLink.href = accountLink.href.replace('testnet', networkId)
  contractLink.href = contractLink.href.replace('testnet', networkId)
}

async function getMemeList() {
  memeList =  await window.contract.get_meme_list();
  memeContractsInitButton.disabled = false;
  memeListLabel.innerHTML = memeList.length;
  console.log(memeList);
}

async function initMemeContracts() {
   memeList.forEach(async meme => {
    memeContracts.push(
      await new Contract(
        window.walletConnection.account(), 
        meme + '.' + nearConfig.contractName, 
        { viewMethods: ['get_meme', 'get_recent_comments'], changeMethods: ['add_comment']}))
      })
    
      await Promise.all(memeContracts)
      memeShowButton.disabled = false;
      memeWriteCommentButton.disabled = false;
      getRecentCommentsButton.disabled = false;

      memeContractsInitLabel.innerHTML = "true";

      addOptions(memeSelectElement)
      addOptions(submitCommentSelectElement)
      addOptions(recentCommentSelectElement)

      console.log(memeContracts)
      // ... DOM manipulation here
}

async function showMeme() {
  const memeIndex = memeSelectElement.value;
  const meme = await memeContracts[memeIndex].get_meme()
  memeTextElement.innerHTML = JSON.stringify(meme);
}


async function writeCommentToMeme() {
  const comment = commentInputElement.value;
  const memeIndex = submitCommentSelectElement.value;
  const result = await memeContracts[memeIndex].add_comment({text: comment});

  // show notification
  document.querySelector('[data-behavior=notification]').style.display = 'block'

  // remove notification again after css animation completes
  // this allows it to be shown again next time the form is submitted
  setTimeout(() => {
    document.querySelector('[data-behavior=notification]').style.display = 'none'
  }, 11000)

  console.log(result);
}

function addComments(comments) {
  commentsContainer.innerHTML = "";
  for (let i = 0; i < comments.length; i++) {
      const element = document.createElement("p");
      element.innerHTML = JSON.stringify(comments[i]);
      element.style = "word-break: break-word;"
      commentsContainer.appendChild(element);
  }
}

async function getRecentComments() {
  const memeIndex = recentCommentSelectElement.value;
  const recentComments = await memeContracts[memeIndex].get_recent_comments();
  addComments(recentComments);
} 

// `nearInitPromise` gets called on page load
window.nearInitPromise = initContract()
  .then(() => {
    if (window.walletConnection.isSignedIn()) signedInFlow()
    else signedOutFlow()
  })
  .catch(console.error)

function addOptions(element) {
  for (let counter = 0; counter < memeContracts.length; counter++) {
    const option = document.createElement("option");
    option.text = counter;
    element.add(option);
  }
}
