const PAGE_SIZE = 10
let currentPage = 1;
let pokemons = []
let sortedPokemon = [];
const numPageBtn = 5;


const updatePaginationDiv = (currentPage, numPages, numPageBtn) => { 
  $('#pagination').empty();

  // Calculate the start index and end index for buttons
  var startI = Math.max(1, currentPage-Math.floor(numPageBtn/2));
  var endI = Math.min(numPages, currentPage+Math.floor(numPageBtn/2));

  if (endI - startI < numPageBtn - 1) {
    startI = Math.max(1, endI - numPageBtn + 1);
  }

  // Add "First" and "Prev" buttons if not on the first page
  if (currentPage > 1) {
    $('#pagination').append(`<button type="button" class="btn btn-primary pageBtn ml-1 mr-1" id="pageFirst" pageNum="1">First</button>`);
    $('#pagination').append(`<button type="button" class="btn btn-primary pageBtn ml-1 mr-1" id="pagePrev" pageNum="${currentPage-1}">Prev</button>`);
  };
  
  for (let i = startI; i <= endI; i++) {
    var active = "";
    if (i == currentPage) {
      active = "active";
    }
    $('#pagination').append(`
    <button class="btn btn-primary pageBtn ${active} ml-1 numberedButtons" value="${i}">${i}</button>
    `)
  }

  // Add "Next" and "Last" buttons if not on the last page
  if (currentPage < numPages) {
    $('#pagination').append(`<button type="button" class="btn btn-primary pageBtn ml-1 mr-1" id="pageNext" pageNum="${currentPage+1}">Next</button>`);
    $('#pagination').append(`<button type="button" class="btn btn-primary pageBtn ml-1 mr-1" id="pageLast" pageNum="${numPages}">Last</button>`);
  }
}


const paginate = async (currentPage, PAGE_SIZE, pokemons) => {
  $('#pokeCards').empty();

  selected_pokemons = pokemons.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  $('#pokeCards').empty()
  selected_pokemons.forEach(async (pokemon) => {
    const res = await axios.get(pokemon.url)
    $('#pokeCards').append(`
      <div class="pokeCard card" pokeName=${res.data.name}   >
        <h3>${res.data.name.toUpperCase()}</h3> 
        <img src="${res.data.sprites.front_default}" alt="${res.data.name}"/>
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
          More
        </button>
      </div>  
    `)
  });

  const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
  updatePaginationDiv(currentPage, numPages, numPageBtn);
};

const filterDiv = async () => {
  try {
    const response = await axios.get("https://pokeapi.co/api/v2/type");
    const pokemons = response.data.results;
    let filterContainer = '';
    // Loop through each type and generate HTML for a checkbox and label
    for (let i = 0; i < pokemons.length; i++) {
      const type = pokemons[i];
      filterContainer += `
        <div class="filterContainer">
          <input type="checkbox" id="${i}" name="${type.name}" value="${type.name}" class="checkbox">
          <label for="${type.name}" class="label">${type.name}</label>
        </div>
      `;
    }
    $("#filterTypes").html(filterContainer);
  } catch (error) {
    console.error(error);
  }
};

const currentlyDisplayingNumDiv = (currentPage, showPokemon) => {
  // Calculate the starting and ending indexes of the currently displayed Pokemon
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(currentPage * PAGE_SIZE, showPokemon);
  // Calculate the number of Pokemon being displayed on the current page
  const currentPagePokemonCount = endIndex - startIndex;
  const pokeCountHeader = document.createElement("h1");
  pokeCountHeader.textContent = `Displaying ${currentPagePokemonCount} of ${showPokemon} Pokemon`;
  pokeCountHeader.classList.add("text-center");
  const pokeCountDiv = document.querySelector("#pokeCount");
  pokeCountDiv.innerHTML = "";
  pokeCountDiv.appendChild(pokeCountHeader);
};

const filter = async ({ pokemonTypes }) => {
  const response = await axios.get("https://pokeapi.co/api/v2/pokemon?offset=0&limit=810");
  const pokemons = response.data.results;
  // Filter the Pokemon based on selected types
  const filteredPokemon = await Promise.all(pokemons.map(async (pokemon) => {
    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemon.name}`);
    const pokemonTypesArray = res.data.types && res.data.types.map((type) => type.type.name);
    // Check if the Pokemon has all the selected types
    return pokemonTypes.every((typeName) => pokemonTypesArray && pokemonTypesArray.includes(typeName)) ? pokemon : null;
  }));
  // Remove the null values from the filtered Pokemon array
  const filteredPokemonNotNull = filteredPokemon.filter((pokemon) => pokemon !== null);
  sortedPokemon = filteredPokemonNotNull;

  // Update pagination and currently displaying count for filtered Pokemon
  paginate(1, PAGE_SIZE, filteredPokemonNotNull);
  const numPages = Math.ceil(filteredPokemonNotNull.length / PAGE_SIZE);
  updatePaginationDiv(1, numPages, numPageBtn);
  currentlyDisplayingNumDiv(currentPage, filteredPokemonNotNull.length);
};

const setup = async () => {
  // test out poke api using axios here
  $('#pokeCards').empty()
  let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
  pokemons = response.data.results;


  paginate(currentPage, PAGE_SIZE, pokemons);
  const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
  updatePaginationDiv(currentPage, numPages, numPageBtn);
  filterDiv();
  currentlyDisplayingNumDiv(currentPage, pokemons.length);

  $("body").on("change", ".checkbox", function (e) {
    const pokemonTypes = $(".checkbox:checked").map(function () {
      return $(this).val();
    }).get();
    filter({pokemonTypes});
  });
  
  // pop up modal when clicking on a pokemon card
  // add event listener to each pokemon card
  $('body').on('click', '.pokeCard', async function (e) {
    const pokemonName = $(this).attr('pokeName')
    // console.log("pokemonName: ", pokemonName);
    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`)
    // console.log("res.data: ", res.data);
    const types = res.data.types.map((type) => type.type.name)
    // console.log("types: ", types);
    $('.modal-body').html(`
        <div style="width:200px">
        <img src="${res.data.sprites.other['official-artwork'].front_default}" alt="${res.data.name}"/>
        <div>
        <h3>Abilities</h3>
        <ul>
        ${res.data.abilities.map((ability) => `<li>${ability.ability.name}</li>`).join('')}
        </ul>
        </div>

        <div>
        <h3>Stats</h3>
        <ul>
        ${res.data.stats.map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
        </ul>

        </div>

        </div>
          <h3>Types</h3>
          <ul>
          ${types.map((type) => `<li>${type}</li>`).join('')}
          </ul>
      
        `)
    $('.modal-title').html(`
        <h2>${res.data.name.toUpperCase()}</h2>
        <h5>${res.data.id}</h5>
        `)
  })

    // add event listener to pagination buttons
  $('body').on('click', ".numberedButtons", async function (e) {
    currentPage = Number(e.target.value)
    paginate(currentPage, PAGE_SIZE, pokemons)

    //update pagination buttons
    updatePaginationDiv(currentPage, numPages, numPageBtn)
  });

  // Add event listener to previous button
  $('body').on('click', "#pagePrev", async function (e) {
    currentPage = Number(e.target.getAttribute("pageNum"));
    paginate(currentPage, PAGE_SIZE, pokemons);

    //update pagination buttons
    updatePaginationDiv(currentPage, numPages, numPageBtn);
  });

  // Add event listener to next button
  $('body').on('click', "#pageNext", async function (e) {
    currentPage = Number(e.target.getAttribute("pageNum"));
    paginate(currentPage, PAGE_SIZE, pokemons);

    //update pagination buttons
    updatePaginationDiv(currentPage, numPages, numPageBtn);
  });

  // Add event listener to first page button
  $('body').on('click', "#pageFirst", async function (e) {
    currentPage = 1;
    paginate(currentPage, PAGE_SIZE, pokemons);

    //update pagination buttons
    updatePaginationDiv(currentPage, numPages, numPageBtn);
  });

  // Add event listener to last page button
  $('body').on('click', "#pageLast", async function (e) {
    currentPage = numPages;
    paginate(currentPage, PAGE_SIZE, pokemons);

    //update pagination buttons
    updatePaginationDiv(currentPage, numPages, numPageBtn);
  });


}


$(document).ready(setup)