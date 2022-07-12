// create variable to hold db connection
let db;
const request = indexedDB.open("dinero_tracker", 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("new_tran", { autoIncrement: true });
};

// upon a successful
request.onsuccess = function (event) {
  // when db is successfully created with its object store
  db = event.target.result;
  // check if app is online.
  if (navigator.onLine) {
    uploadTran();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a transaction and there's no internet connection
function saveRecord(record) {
 const transaction = db.transaction(["new_tran"], "readwrite");

  // access the object store for new transaction
  const transactionObjectStore = transaction.objectStore("new_tran");

  // add record to your store with add method
  transactionObjectStore.add(record);
}

function uploadTran() {
  // open a transaction on your db
  const transaction = db.transaction(["new_tran"], "readwrite");

  // access your object store
  const transactionObjectStore = transaction.objectStore("new_tran");

  // get all transactions from store and set to a variable
  const getAll = transactionObjectStore.getAll();
}

// upon a successful .getAll() execution, run this function
getAll.onsuccess = function () {
  // if there was data in indexedDb's store, let's send it to the api server
  if (getAll.result.length > 0) {
    fetch("/api/transaction", {
      method: "POST",
      body: JSON.stringify(getAll.result),
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((serverResponse) => {
        if (serverResponse.message) {
          throw new Error(serverResponse);
        }
        // open one more transaction
        const transaction = db.transaction(["new_tran"], "readwrite");
        // access the  transaction object store
        const transactionObjectStore =
          transaction.objectStore("new_tran");
        // clear all items in your store
        transactionObjectStore.clear();

        alert("All transactions have been submitted.");
      })
      .catch((err) => {
        console.log(err);
      });
  }
};

// listen for app coming back online
window.addEventListener("online", uploadTran);
