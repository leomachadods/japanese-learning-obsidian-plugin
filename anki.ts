import axios from 'axios';

export default class AnkiBridge {

    deckName = "Japanese";
	modelName = 'Basic';
		// Substitua 'FrontField' e 'BackField' pelos nomes dos campos no seu modelo
	frontField = 'Front';
	backField = 'Back';

    async createAnkiDeck() {
		let result = await axios.post('http://localhost:8765', {
			action: 'createDeck',
			version: 6,
			params: {
				deck: this.deckName
			}
		});
	
		if (result.data.error)
			console.log(`Erro ao criar o baralho do Anki: ${result.data.error}`);
	
	}

    async createAnkiCard(term: string, reading: string, definition: string) {

		let front = term;
		let back;

		if(!reading) {
			back = `${definition}`;
		} else {
			back = `${definition}<br><br>「${reading}`;
		}
		

		let note = {
			deckName: this.deckName,
			modelName: this.modelName,
			fields: {
				[this.frontField]: front,
				[this.backField]: back
			},
			options: {
				allowDuplicate: false
			},
			tags: []
		};

		let result = await axios.post('http://localhost:8765', {
			action: 'addNote',
			version: 6,
			params: {
				note: note
			}
		});

		if (result.data.error)
			console.log(`Erro ao criar cartão do Anki: ${result.data.error}`);
		
	}


	async createDeckBasedOnFileDate(fileSections: string[]) {
		let firstSection = fileSections.first()?.trim();
        
        if(!firstSection){
            return
        }

        let dateRegex = /date: (\d{4}-\d{2}-\d{2})/
        let match = firstSection.match(dateRegex);
        if (match) {
            let date = match[1];
            this.deckName = date
            await this.createAnkiDeck();
        }
	}

}