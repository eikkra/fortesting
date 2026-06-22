import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

getAuth,
GoogleAuthProvider,
signInWithPopup,
EmailAuthProvider,
linkWithCredential

}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {

getFirestore,
doc,
setDoc,
getDoc,
getDocs,
collection,
runTransaction,
query,
where

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {

getStorage,
ref,
uploadBytes,
getDownloadURL,
deleteObject

}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";



/* FIREBASE CONFIG */

const firebaseConfig = {

apiKey: "AIzaSyDwPilelp6BgHhHD8Hs_cHx96ZJNZdeYag",

authDomain: "ekickhub-bd.firebaseapp.com",

projectId: "ekickhub-bd",

storageBucket: "ekickhub-bd.firebasestorage.app",

messagingSenderId: "306381500871",

appId: "1:306381500871:web:50e1cc59d823872328e9e2"

};



/* INITIALIZE */

const app = initializeApp(firebaseConfig)

const auth = getAuth(app)

const db = getFirestore(app)

const storage = getStorage(app)



/* ELEMENTS */

const msg =
document.getElementById("msg")

const emailInput =
document.getElementById("email")

const passwordInput =
document.getElementById("password")



/* USER */

let currentUser = null

let cropper = null

let croppedBlob = null

let uploading = false



/* PASSWORD SHOW */

document.getElementById("eyeBtn")
.onclick = ()=>{

passwordInput.type =
passwordInput.type === "password"
? "text"
: "password"

}



/* GOOGLE CONNECT */

document.getElementById("googleBtn")
.onclick = async ()=>{

msg.innerHTML =
"Please wait..."

try{

const provider =
new GoogleAuthProvider()

const result =
await signInWithPopup(
auth,
provider
)

currentUser =
result.user

emailInput.value =
currentUser.email

msg.innerHTML =
"Google connected successfully"

}catch(error){

console.log(error)

msg.innerHTML =
error.message

}

}



/* IMAGE CROP */

document.getElementById("image")
.onchange = (e)=>{

const file =
e.target.files[0]

if(!file) return

const reader =
new FileReader()

reader.onload = ()=>{

document.getElementById("cropContainer")
.style.display = "block"

const image =
document.getElementById("preview")

image.src =
reader.result

if(cropper){

cropper.destroy()

}

cropper =
new Cropper(image,{

aspectRatio:1,

viewMode:1,

dragMode:"move",

autoCropArea:1,

responsive:true

})

}

reader.readAsDataURL(file)

}



/* REGISTER */

document.getElementById("registerBtn")
.onclick = async ()=>{

if(uploading) return

uploading = true

const registerBtn =
document.getElementById("registerBtn")

registerBtn.disabled = true

registerBtn.innerHTML =
"PLEASE WAIT..."

msg.innerHTML =
"Please wait..."

try{

if(!currentUser){

msg.innerHTML =
"Connect Google first"

uploading = false

registerBtn.disabled = false

registerBtn.innerHTML =
"REGISTER NOW"

return

}



/* GET VALUES */

const full_name =
document.getElementById("full_name")
.value.trim()

const email =
emailInput.value.trim()

const password =
passwordInput.value.trim()

const phone =
document.getElementById("phone")
.value.trim()

const dob =
document.getElementById("dob")
.value

const gender =
document.getElementById("gender")
.value

const country =
document.getElementById("country")
.value

const district =
document.getElementById("district")
.value.trim()

const position =
document.getElementById("position")
.value

const konami_id =
document.getElementById("konami_id")
.value.trim().toUpperCase()

const device_name =
document.getElementById("device_name")
.value.trim()

const fb_id_url =
document.getElementById("fb_id_url")
.value.trim().toLowerCase()

const imageFile =
document.getElementById("image")
.files[0]



/* VALIDATION */

if(

!full_name ||
!email ||
!password ||
!phone ||
!dob ||
!gender ||
!country ||
!district ||
!position ||
!konami_id ||
!device_name ||
!fb_id_url ||
!imageFile

){

msg.innerHTML =
"Please fill all fields"

uploading = false

registerBtn.disabled = false

registerBtn.innerHTML =
"REGISTER NOW"

return

}



/* PASSWORD */

if(password.length < 6){

msg.innerHTML =
"Password minimum 6 characters"

uploading = false

registerBtn.disabled = false

registerBtn.innerHTML =
"REGISTER NOW"

return

}



/* CROP CHECK */

if(!cropper){

msg.innerHTML =
"Please crop image"

uploading = false

registerBtn.disabled = false

registerBtn.innerHTML =
"REGISTER NOW"

return

}



/* KONAMI FORMAT */

const konamiPattern =
/^[A-Z]{4}-[0-9]{3}-[0-9]{3}-[0-9]{3}$/


if(!konamiPattern.test(konami_id)){

msg.innerHTML =
"Format: ASDF-000-000-000"

uploading = false

registerBtn.disabled = false

registerBtn.innerHTML =
"REGISTER NOW"

return

}



/* CHECK DUPLICATE */

let duplicate = false

const emailQuery =
query(
collection(db,"users"),
where("email","==",email)
)

const konamiQuery =
query(
collection(db,"users"),
where("konami_id","==",konami_id)
)

const fbQuery =
query(
collection(db,"users"),
where("fb_id_url","==",fb_id_url)
)

const [

emailSnap,
konamiSnap,
fbSnap

] = await Promise.all([

getDocs(emailQuery),
getDocs(konamiQuery),
getDocs(fbQuery)

])

if(

!emailSnap.empty ||

!konamiSnap.empty ||

!fbSnap.empty

){

duplicate = true

}

const userRef =
doc(db,"users",currentUser.uid)

const existingUser =
await getDoc(userRef)

if(existingUser.exists()){

msg.innerHTML =
"Account already submitted"

uploading = false

registerBtn.disabled = false

registerBtn.innerHTML =
"REGISTER NOW"

return

}

if(duplicate){

msg.innerHTML =
"Email / Konami ID / FB URL already used"

uploading = false

registerBtn.disabled = false

registerBtn.innerHTML =
"REGISTER NOW"

return

}

/* LINK PASSWORD */

const credential =
EmailAuthProvider.credential(
email,
password
)

await linkWithCredential(
currentUser,
credential
)



/* PROCESS IMAGE */

msg.innerHTML =
"Processing image..."


croppedBlob =
await new Promise((resolve)=>{

cropper.getCroppedCanvas({

width:500,
height:500

}).toBlob(

(blob)=>{

resolve(blob)

},

"image/jpeg",

0.80

)

})



/* IMAGE PATH */

const imageRef =
ref(
storage,
`players/${currentUser.uid}.jpg`
)



/* DELETE OLD IMAGE */

try{

await deleteObject(imageRef)

}catch(e){}



/* UPLOAD IMAGE */

msg.innerHTML =
"Uploading image..."


await uploadBytes(
imageRef,
croppedBlob,
{
contentType:"image/jpeg"
}
)

const imageUrl =
await getDownloadURL(imageRef)

/* UNIQUE PLAYER ID */

const counterRef =
doc(db,"system","player_counter")

const player_id =
await runTransaction(db,async(transaction)=>{

const counterDoc =
await transaction.get(counterRef)

let lastNumber = 0

if(counterDoc.exists()){

lastNumber =
counterDoc.data().last_id || 0

}

const newNumber =
lastNumber + 1

transaction.set(counterRef,{
last_id:newNumber
})

return `EKH-${String(newNumber).padStart(6,"0")}`

})


/* SAVE DATA */

msg.innerHTML =
"Saving profile..."

await setDoc(

doc(db,"users",currentUser.uid),

{

player_id,

full_name,

email,

phone,

dob,

gender,

country,

district,

position,

konami_id,

device_name,

fb_id_url,

image:imageUrl,

approved:false,

roles:["player"],

plan:"free",

created_at:new Date().toISOString()

}

)



msg.innerHTML =
"Registration successful. Waiting for admin approval."

registerBtn.innerHTML =
"SUCCESS"



setTimeout(()=>{

window.location.href =
"../login/"

},2500)



}catch(error){

console.log(error)

msg.innerHTML =
error.message

registerBtn.disabled = false

registerBtn.innerHTML =
"REGISTER NOW"

uploading = false

}

}