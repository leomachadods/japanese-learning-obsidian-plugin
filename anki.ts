import axios from 'axios';
import Word from 'word';

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

    async createAnkiCard(word: Word) {

		let front = word.term;
		let back;

		if(!word.reading) {
			back = `${word.definition}`;
		} else {
			back = `${word.definition}<br><br>「${word.reading}`;
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


	async createDeckBasedOnFileDate(fileDate: string) {
            this.deckName = fileDate
            await this.createAnkiDeck();
	}

}