function pagi_search(search,tbl,pagiDiv){

      const rowsPerPage = 10;
        let currentPage = 1;
    
        function filterTable() {
            const searchTerm = $(search).val().toLowerCase();
            const rows = $(`${tbl} tbody tr`);
    
            rows.each(function() {
                const rowText = $(this).text().toLowerCase();
                if (rowText.includes(searchTerm)) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
        }
    
    
    function paginateTable() {
            const rows = $(`${tbl} tbody tr`);
            const totalRows = rows.length;
            const totalPages = Math.ceil(totalRows / rowsPerPage);
    
            // Hide all rows
            rows.hide();
    
            // Show only the rows for the current page
            rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).show();
    
            // Generate pagination buttons
            let paginationButtons = '';
            for (let i = 1; i <= totalPages; i++) {
                paginationButtons += `<button class="page-btn btn-primary btn-style ${i === currentPage ? 'active' : ''}" data-page="${i}" >${i}</button>`;
            }
    
            $(pagiDiv).html(paginationButtons);
    
            // Add click event for pagination buttons
            $('.page-btn').on('click', function() {
                currentPage = $(this).data('page');
                paginateTable();
            });
        }
    
        $('#searchBox').on('keyup', function() {
            filterTable();
            currentPage = 1;
            //paginateTable();
        });
    
        filterTable();
        paginateTable();
    }
 
    
    
    
    
    
  
  