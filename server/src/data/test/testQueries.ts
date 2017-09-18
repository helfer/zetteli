export default `
  mutation create {
    createZetteli(z: {
          id: "4",
          body: "Zetteli 4444",
          tags: [
            "t44",
            "t23"
          ],
          datetime: "2017-09-18T09:53:11.443Z"
    })
  }
  
  query get {
    zettelis {
      id
      datetime
      tags
      body
    }
  }
  
  mutation del {
    deleteZetteli(id: "4")
  }
  
  mutation update {
      updateZetteli(z: {
          id: "4",
          body: "Z4",
          tags: [
            "t444",
            "t234"
          ],
          datetime: "2017-09-18T10:14:11.444Z"
    })
  }
  `;
