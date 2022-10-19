/*
>>> importing needed libraries.
*/

const prompt = require("prompt-sync")();
const puppeteer = require('puppeteer');

// global variables
const amazonWebsite = "http://www.amazon.de/";
const bookwebsite = 'https://www.goodreads.com/choiceawards/best-books-2020';

//needed selectors object
const selectors = {
  genreNames : ".category.clearFix a h4",
  genreUrls : ".categoryContainer .category.clearFix a",
  genreBookImage : ".pollAnswer__bookLink img",
  amazonSearchBox : "#twotabsearchtextbox",
  amazonSearchButton : "input[id=nav-search-submit-button]",
  amazonSearchResultNames : ".a-link-normal.s-no-outline img",
  amazonSearchResultLinks : ".aok-relative .rush-component a",
  amazonBuyNowButton : "input[id=buy-now-button]",
};





/*
>>> function: called getBookName takes 3 parameters.
>>> param1 : the page wich is a subclass of the browser class ... the page that we will work on in the browser.
>>> param2 : the link of the books website (good reads).
>>> param3 : the Genre that was entered by the user.
>>> it returns a random chosen book with the same genre that was entered by the user
>>> steps:
>>>   1- it navigates to the good reads website and then goes to link coresponding to the entered genre by getting data from the webiste and filtering the unwanted data,
         and checking if the genre that was entered does not exist, then the program terminagtes and shows a message to the user to pick an available genre with a list of the genres available.
>>>   2- it randomly picks a book name with the same genre

 */
async function getBookName (page,url,chosenGenre) {
  let matched = false;
  let bookIndex = 0
  try{
    await page.goto(url);
    
    genreTags = await page.$$eval (selectors.genreNames , genres => genres.map (name => name.textContent.split ('\n') [1] ));
  
    Links = await page.$$eval (selectors.genreUrls , links => links.map (name => name.href));
    
    genreLinks = Links.filter (link => link != 'https://www.goodreads.com/choiceawards/best-books-2020#');
    
    for (genre of genreTags)
    {
      if (genre.toLowerCase() == chosenGenre.toLowerCase())
      {
        matched = true;
        bookIndex = genreTags.indexOf(genre);
      }
    };

    
    matched ? await page.goto (genreLinks [bookIndex]) : console.log (`The genre you chose is not available, please choose an available genre : ${genreTags.join(", ")}`)

    await page.waitForSelector (selectors.genreBookImage);
    books = await page.$$eval (selectors.genreBookImage , book => book.map (name => name.getAttribute ('alt')));

    chosenBook = books [Math.floor (Math.random () * books.length)];
    
    return (chosenBook);

  }catch{

    console.log ("Problem with the book website ");

  }
  
};

/*
>>> function : called pickAmazonBook and takes 3 parameters.
>>> param1 : the page wich is a subclass of the browser class ... the page that we will work on in the browser.
>>> param2 : the name of the book that was returned by the getBookName function.
>>> param3 : the link to the Amazon website.
>>> it returns the link of the picked book on amazon making it ready to go to check out
>>> steps:
      1- after navigating to amazon website it types the name of the boos in the search box and then clicks on the search button.
      2- it filters through the results and picks the correct book and goes to it's url.
    
*/


async function pickAmazonBook (page, bookName , url){
  try{
    await page.goto (url);
    await page.type  (selectors.amazonSearchBox, bookName );
    await page.$eval(selectors.amazonSearchButton, (el) => el.click());

    await page.waitForSelector (selectors.amazonSearchResultNames);
    shearchResultNames = await page.$$eval (selectors.amazonSearchResultNames, link => link.map (name => name.getAttribute ("alt")));
    
    bookNameWithoutAuthor = bookName.split (' by') [0];

    chosenBookSearchPage = shearchResultNames.filter (name => name.includes (bookNameWithoutAuthor));
    
    shearchResultLinks = await page.$$eval (selectors.amazonSearchResultLinks, (link) => link.map ((name) => name.href));
    
    let pickedBookUrl = shearchResultLinks [shearchResultNames.indexOf (chosenBookSearchPage [0])];
    await page.goto (pickedBookUrl);
    
    return (pickedBookUrl)
  }catch{
    console.log ('Problem with Amazon website');
  }
}

/*
>>> function : called goToCheckout and has 2 parameters.
>>> param1 : the page wich is a subclass of the browser class ... the page that we will work on in the browser.
>>> param2 : the link that was passed by the pickAmazonBook function.
>>> it doesn't return any values.
>>> steps:
      1- it navigates to the picked book on amazon.
      2- it clicks on the buy now button taking the user to the checkout page.

*/

async function goToCheckout (page,url){
  try{
    await page.goto (url);
    await page.waitForSelector (selectors.amazonBuyNowButton);
    await page.$eval (selectors.amazonBuyNowButton, (el) => el.click());
  }catch{
    console.log ('Problem with checkout on Amazon');
  }
}

/*
>>> function : called main, it takes no parameters.
>>> inside this function where the main program and it's function will be called.
>>> it does not return anything.
>>> steps:
      1- message to user to enter the genre name
      2- it creats the browser class that we will use to scrap the data and show the user the results.
      3- goes to the first tab that was open in the browser.
      4- calls the getBookName function and passes the needed parameters to the function and stores the returned data in a variable.
      5- calls the pickAmazonBook function and passes the needed parameters to the function and stores the returned data in a variable.
      6- calls the goTOCheckout function

*/

async function main(){
  console.log("Enter preferred book genre...");
  const chosenGenre = prompt("type here ... ");

  const browser = await puppeteer.launch(
    {
    headless: false,
    defaultViewport: null
    }
  );
  const [page] = await browser.pages();
  let bookName =await getBookName (page , bookwebsite , chosenGenre);
  let pickedBookUrl = await pickAmazonBook (page , bookName , amazonWebsite)
  await goToCheckout (page , pickedBookUrl);
}

/*
>>> calling the main function to start the program.
*/
main ();




  