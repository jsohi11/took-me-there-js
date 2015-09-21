function getProducts (event){
      $.get("/api/products", handleResults)
    }

    function handleResults(results) {
      results["products"].forEach(displayProducts);
    }

    function displayProducts(product) {
    	alert(product.display_name);
    }

getProducts()