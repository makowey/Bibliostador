// Comprehensive Bible Questions Database
// 100 questions across different categories and difficulty levels

export interface Question {
	id: string;
	text: string;
	type: 'multiple_choice' | 'numerical' | 'text';
	category: 'Old Testament' | 'New Testament' | 'General' | 'People' | 'Places' | 'Events';
	difficulty: 'easy' | 'medium' | 'hard';
	// Multiple choice fields
	options?: string[];
	correctAnswer?: number;
	// Numerical fields
	numericalAnswer?: number;
	// Text fields
	textAnswer?: string;
}

export const questions: Question[] = [
	// MULTIPLE CHOICE QUESTIONS (60 questions)
	
	// Old Testament - Easy (15 questions)
	{
		id: 'mc_ot_01',
		text: 'Who led the Israelites out of Egypt?',
		type: 'multiple_choice',
		options: ['Moses', 'David', 'Abraham', 'Joshua'],
		correctAnswer: 0,
		category: 'Old Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_ot_02',
		text: 'What did God create on the first day?',
		type: 'multiple_choice',
		options: ['Animals', 'Plants', 'Light', 'Humans'],
		correctAnswer: 2,
		category: 'Old Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_ot_03',
		text: 'Who built the ark?',
		type: 'multiple_choice',
		options: ['Noah', 'Moses', 'Abraham', 'David'],
		correctAnswer: 0,
		category: 'Old Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_ot_04',
		text: 'What did Adam and Eve eat that was forbidden?',
		type: 'multiple_choice',
		options: ['Apple', 'Grape', 'Fruit from the tree of knowledge', 'Honey'],
		correctAnswer: 2,
		category: 'Old Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_ot_05',
		text: 'Who was the first king of Israel?',
		type: 'multiple_choice',
		options: ['David', 'Saul', 'Solomon', 'Samuel'],
		correctAnswer: 1,
		category: 'Old Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_ot_06',
		text: 'What did God use to destroy the earth in Noah\'s time?',
		type: 'multiple_choice',
		options: ['Fire', 'Flood', 'Earthquake', 'Plague'],
		correctAnswer: 1,
		category: 'Old Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_ot_07',
		text: 'Who was Abraham\'s son of promise?',
		type: 'multiple_choice',
		options: ['Ishmael', 'Isaac', 'Jacob', 'Esau'],
		correctAnswer: 1,
		category: 'Old Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_ot_08',
		text: 'Which brother did Cain kill?',
		type: 'multiple_choice',
		options: ['Seth', 'Abel', 'Enoch', 'Noah'],
		correctAnswer: 1,
		category: 'Old Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_ot_09',
		text: 'What did Moses use to part the Red Sea?',
		type: 'multiple_choice',
		options: ['His hands', 'A rod/staff', 'Prayer only', 'A sword'],
		correctAnswer: 1,
		category: 'Old Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_ot_10',
		text: 'Who was David\'s best friend?',
		type: 'multiple_choice',
		options: ['Saul', 'Jonathan', 'Samuel', 'Solomon'],
		correctAnswer: 1,
		category: 'Old Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_ot_11',
		text: 'What did David use to defeat Goliath?',
		type: 'multiple_choice',
		options: ['Sword', 'Spear', 'Sling and stone', 'Bow and arrow'],
		correctAnswer: 2,
		category: 'Old Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_ot_12',
		text: 'Who interpreted Pharaoh\'s dreams?',
		type: 'multiple_choice',
		options: ['Moses', 'Joseph', 'Aaron', 'Daniel'],
		correctAnswer: 1,
		category: 'Old Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_ot_13',
		text: 'Which sea did Moses part?',
		type: 'multiple_choice',
		options: ['Dead Sea', 'Mediterranean Sea', 'Red Sea', 'Sea of Galilee'],
		correctAnswer: 2,
		category: 'Old Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_ot_14',
		text: 'Who was thrown into a den of lions?',
		type: 'multiple_choice',
		options: ['Daniel', 'David', 'Joseph', 'Joshua'],
		correctAnswer: 0,
		category: 'Old Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_ot_15',
		text: 'What food did God provide in the wilderness?',
		type: 'multiple_choice',
		options: ['Bread', 'Manna', 'Fish', 'Meat'],
		correctAnswer: 1,
		category: 'Old Testament',
		difficulty: 'easy'
	},

	// New Testament - Easy (15 questions)
	{
		id: 'mc_nt_01',
		text: 'In which city was Jesus born?',
		type: 'multiple_choice',
		options: ['Jerusalem', 'Nazareth', 'Bethlehem', 'Capernaum'],
		correctAnswer: 2,
		category: 'New Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_nt_02',
		text: 'Who baptized Jesus?',
		type: 'multiple_choice',
		options: ['Peter', 'John the Baptist', 'Paul', 'Andrew'],
		correctAnswer: 1,
		category: 'New Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_nt_03',
		text: 'How many disciples did Jesus choose?',
		type: 'multiple_choice',
		options: ['10', '12', '14', '16'],
		correctAnswer: 1,
		category: 'New Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_nt_04',
		text: 'Who denied Jesus three times?',
		type: 'multiple_choice',
		options: ['Judas', 'Peter', 'Thomas', 'John'],
		correctAnswer: 1,
		category: 'New Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_nt_05',
		text: 'Who betrayed Jesus?',
		type: 'multiple_choice',
		options: ['Peter', 'John', 'Judas', 'Thomas'],
		correctAnswer: 2,
		category: 'New Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_nt_06',
		text: 'On which day did Jesus rise from the dead?',
		type: 'multiple_choice',
		options: ['First day', 'Second day', 'Third day', 'Seventh day'],
		correctAnswer: 2,
		category: 'New Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_nt_07',
		text: 'Who was Jesus\' mother?',
		type: 'multiple_choice',
		options: ['Martha', 'Mary', 'Elizabeth', 'Anna'],
		correctAnswer: 1,
		category: 'New Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_nt_08',
		text: 'What was Matthew\'s occupation before following Jesus?',
		type: 'multiple_choice',
		options: ['Fisherman', 'Tax collector', 'Carpenter', 'Farmer'],
		correctAnswer: 1,
		category: 'New Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_nt_09',
		text: 'Where did Jesus perform his first miracle?',
		type: 'multiple_choice',
		options: ['Jerusalem', 'Capernaum', 'Cana', 'Bethany'],
		correctAnswer: 2,
		category: 'New Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_nt_10',
		text: 'What was Jesus\' first miracle?',
		type: 'multiple_choice',
		options: ['Healing the blind', 'Walking on water', 'Turning water to wine', 'Feeding 5000'],
		correctAnswer: 2,
		category: 'New Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_nt_11',
		text: 'Who wrote most of the New Testament letters?',
		type: 'multiple_choice',
		options: ['Peter', 'John', 'Paul', 'James'],
		correctAnswer: 2,
		category: 'New Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_nt_12',
		text: 'What did the wise men bring to baby Jesus?',
		type: 'multiple_choice',
		options: ['Gold, silver, bronze', 'Gold, frankincense, myrrh', 'Sheep, cattle, doves', 'Bread, wine, oil'],
		correctAnswer: 1,
		category: 'New Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_nt_13',
		text: 'Who was the first martyr?',
		type: 'multiple_choice',
		options: ['James', 'Stephen', 'Peter', 'Paul'],
		correctAnswer: 1,
		category: 'New Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_nt_14',
		text: 'What was Saul\'s name changed to?',
		type: 'multiple_choice',
		options: ['Peter', 'Paul', 'Philip', 'Phillip'],
		correctAnswer: 1,
		category: 'New Testament',
		difficulty: 'easy'
	},
	{
		id: 'mc_nt_15',
		text: 'How many days was Jesus in the tomb?',
		type: 'multiple_choice',
		options: ['One', 'Two', 'Three', 'Four'],
		correctAnswer: 2,
		category: 'New Testament',
		difficulty: 'easy'
	},

	// Medium Difficulty (15 questions)
	{
		id: 'mc_med_01',
		text: 'Which judge was known for his great strength?',
		type: 'multiple_choice',
		options: ['Gideon', 'Samson', 'Deborah', 'Samuel'],
		correctAnswer: 1,
		category: 'Old Testament',
		difficulty: 'medium'
	},
	{
		id: 'mc_med_02',
		text: 'Who was the queen that visited Solomon?',
		type: 'multiple_choice',
		options: ['Queen of Egypt', 'Queen of Sheba', 'Queen Esther', 'Queen Vashti'],
		correctAnswer: 1,
		category: 'Old Testament',
		difficulty: 'medium'
	},
	{
		id: 'mc_med_03',
		text: 'Which apostle was known as the doubter?',
		type: 'multiple_choice',
		options: ['Peter', 'Thomas', 'Philip', 'Andrew'],
		correctAnswer: 1,
		category: 'New Testament',
		difficulty: 'medium'
	},
	{
		id: 'mc_med_04',
		text: 'Who was the cupbearer that Nehemiah served?',
		type: 'multiple_choice',
		options: ['King David', 'King Artaxerxes', 'King Nebuchadnezzar', 'King Cyrus'],
		correctAnswer: 1,
		category: 'Old Testament',
		difficulty: 'medium'
	},
	{
		id: 'mc_med_05',
		text: 'Which gospel was written by a doctor?',
		type: 'multiple_choice',
		options: ['Matthew', 'Mark', 'Luke', 'John'],
		correctAnswer: 2,
		category: 'New Testament',
		difficulty: 'medium'
	},
	{
		id: 'mc_med_06',
		text: 'Who replaced Judas as the 12th apostle?',
		type: 'multiple_choice',
		options: ['Matthias', 'Paul', 'Barnabas', 'Timothy'],
		correctAnswer: 0,
		category: 'New Testament',
		difficulty: 'medium'
	},
	{
		id: 'mc_med_07',
		text: 'Which king had a dream about a statue?',
		type: 'multiple_choice',
		options: ['Nebuchadnezzar', 'Belshazzar', 'Darius', 'Cyrus'],
		correctAnswer: 0,
		category: 'Old Testament',
		difficulty: 'medium'
	},
	{
		id: 'mc_med_08',
		text: 'Who was the prophet that confronted King Ahab?',
		type: 'multiple_choice',
		options: ['Elisha', 'Elijah', 'Isaiah', 'Jeremiah'],
		correctAnswer: 1,
		category: 'Old Testament',
		difficulty: 'medium'
	},
	{
		id: 'mc_med_09',
		text: 'Which city\'s walls fell down after marching around them?',
		type: 'multiple_choice',
		options: ['Jerusalem', 'Jericho', 'Babylon', 'Nineveh'],
		correctAnswer: 1,
		category: 'Old Testament',
		difficulty: 'medium'
	},
	{
		id: 'mc_med_10',
		text: 'Who was the Roman governor who sentenced Jesus?',
		type: 'multiple_choice',
		options: ['Caesar', 'Pontius Pilate', 'Herod', 'Felix'],
		correctAnswer: 1,
		category: 'New Testament',
		difficulty: 'medium'
	},
	{
		id: 'mc_med_11',
		text: 'Which prophet was taken up to heaven in a whirlwind?',
		type: 'multiple_choice',
		options: ['Elijah', 'Elisha', 'Enoch', 'Moses'],
		correctAnswer: 0,
		category: 'Old Testament',
		difficulty: 'medium'
	},
	{
		id: 'mc_med_12',
		text: 'Who was the youngest son of Jacob?',
		type: 'multiple_choice',
		options: ['Joseph', 'Benjamin', 'Judah', 'Dan'],
		correctAnswer: 1,
		category: 'Old Testament',
		difficulty: 'medium'
	},
	{
		id: 'mc_med_13',
		text: 'Which island was Paul shipwrecked on?',
		type: 'multiple_choice',
		options: ['Cyprus', 'Crete', 'Malta', 'Rhodes'],
		correctAnswer: 2,
		category: 'New Testament',
		difficulty: 'medium'
	},
	{
		id: 'mc_med_14',
		text: 'Who was the king when Daniel was thrown into the lions\' den?',
		type: 'multiple_choice',
		options: ['Nebuchadnezzar', 'Belshazzar', 'Darius', 'Cyrus'],
		correctAnswer: 2,
		category: 'Old Testament',
		difficulty: 'medium'
	},
	{
		id: 'mc_med_15',
		text: 'Which woman became queen to save the Jews?',
		type: 'multiple_choice',
		options: ['Ruth', 'Esther', 'Deborah', 'Miriam'],
		correctAnswer: 1,
		category: 'Old Testament',
		difficulty: 'medium'
	},

	// Hard Difficulty (15 questions)
	{
		id: 'mc_hard_01',
		text: 'Who was the father of Methuselah?',
		type: 'multiple_choice',
		options: ['Enoch', 'Lamech', 'Seth', 'Jared'],
		correctAnswer: 0,
		category: 'Old Testament',
		difficulty: 'hard'
	},
	{
		id: 'mc_hard_02',
		text: 'Which book comes after 2 Chronicles?',
		type: 'multiple_choice',
		options: ['Ezra', 'Nehemiah', 'Esther', 'Job'],
		correctAnswer: 0,
		category: 'General',
		difficulty: 'hard'
	},
	{
		id: 'mc_hard_03',
		text: 'Who was the high priest when Jesus was arrested?',
		type: 'multiple_choice',
		options: ['Annas', 'Caiaphas', 'Zechariah', 'Eli'],
		correctAnswer: 1,
		category: 'New Testament',
		difficulty: 'hard'
	},
	{
		id: 'mc_hard_04',
		text: 'Which prophet married a prostitute as commanded by God?',
		type: 'multiple_choice',
		options: ['Jeremiah', 'Ezekiel', 'Hosea', 'Amos'],
		correctAnswer: 2,
		category: 'Old Testament',
		difficulty: 'hard'
	},
	{
		id: 'mc_hard_05',
		text: 'What was the name of Abraham\'s hometown?',
		type: 'multiple_choice',
		options: ['Haran', 'Ur', 'Canaan', 'Babylon'],
		correctAnswer: 1,
		category: 'Old Testament',
		difficulty: 'hard'
	},
	{
		id: 'mc_hard_06',
		text: 'Which book contains the verse "For I know the plans I have for you"?',
		type: 'multiple_choice',
		options: ['Isaiah', 'Jeremiah', 'Ezekiel', 'Daniel'],
		correctAnswer: 1,
		category: 'Old Testament',
		difficulty: 'hard'
	},
	{
		id: 'mc_hard_07',
		text: 'Who was the king of Salem who blessed Abraham?',
		type: 'multiple_choice',
		options: ['Melchizedek', 'Abimelech', 'Lot', 'Aner'],
		correctAnswer: 0,
		category: 'Old Testament',
		difficulty: 'hard'
	},
	{
		id: 'mc_hard_08',
		text: 'Which apostle was called Boanerges?',
		type: 'multiple_choice',
		options: ['Peter and Andrew', 'James and John', 'Philip and Bartholomew', 'Matthew and Thomas'],
		correctAnswer: 1,
		category: 'New Testament',
		difficulty: 'hard'
	},
	{
		id: 'mc_hard_09',
		text: 'How many books are in the New Testament?',
		type: 'multiple_choice',
		options: ['25', '26', '27', '28'],
		correctAnswer: 2,
		category: 'General',
		difficulty: 'hard'
	},
	{
		id: 'mc_hard_10',
		text: 'Which river did Naaman wash in to be healed?',
		type: 'multiple_choice',
		options: ['Jordan', 'Euphrates', 'Tigris', 'Nile'],
		correctAnswer: 0,
		category: 'Old Testament',
		difficulty: 'hard'
	},
	{
		id: 'mc_hard_11',
		text: 'Who was the first judge of Israel?',
		type: 'multiple_choice',
		options: ['Othniel', 'Ehud', 'Deborah', 'Gideon'],
		correctAnswer: 0,
		category: 'Old Testament',
		difficulty: 'hard'
	},
	{
		id: 'mc_hard_12',
		text: 'Which church received the letter addressing the Nicolaitans?',
		type: 'multiple_choice',
		options: ['Ephesus', 'Pergamum', 'Both Ephesus and Pergamum', 'Thyatira'],
		correctAnswer: 2,
		category: 'New Testament',
		difficulty: 'hard'
	},
	{
		id: 'mc_hard_13',
		text: 'Who was the mother of John the Baptist?',
		type: 'multiple_choice',
		options: ['Mary', 'Elizabeth', 'Anna', 'Hannah'],
		correctAnswer: 1,
		category: 'New Testament',
		difficulty: 'hard'
	},
	{
		id: 'mc_hard_14',
		text: 'Which king built the first temple?',
		type: 'multiple_choice',
		options: ['David', 'Solomon', 'Hezekiah', 'Josiah'],
		correctAnswer: 1,
		category: 'Old Testament',
		difficulty: 'hard'
	},
	{
		id: 'mc_hard_15',
		text: 'What was Paul\'s Roman name before conversion?',
		type: 'multiple_choice',
		options: ['Saul', 'Silas', 'Stephen', 'Simon'],
		correctAnswer: 0,
		category: 'New Testament',
		difficulty: 'hard'
	},

	// NUMERICAL QUESTIONS (20 questions)
	{
		id: 'num_01',
		text: 'How many years did the Israelites wander in the wilderness?',
		type: 'numerical',
		numericalAnswer: 40,
		category: 'Old Testament',
		difficulty: 'easy'
	},
	{
		id: 'num_02',
		text: 'How many plagues did God send to Egypt?',
		type: 'numerical',
		numericalAnswer: 10,
		category: 'Old Testament',
		difficulty: 'easy'
	},
	{
		id: 'num_03',
		text: 'How many chapters are in the book of Psalms?',
		type: 'numerical',
		numericalAnswer: 150,
		category: 'General',
		difficulty: 'medium'
	},
	{
		id: 'num_04',
		text: 'How many days did it rain during the flood?',
		type: 'numerical',
		numericalAnswer: 40,
		category: 'Old Testament',
		difficulty: 'medium'
	},
	{
		id: 'num_05',
		text: 'How many sons did Jacob have?',
		type: 'numerical',
		numericalAnswer: 12,
		category: 'Old Testament',
		difficulty: 'easy'
	},
	{
		id: 'num_06',
		text: 'How many people were saved in Noah\'s ark?',
		type: 'numerical',
		numericalAnswer: 8,
		category: 'Old Testament',
		difficulty: 'medium'
	},
	{
		id: 'num_07',
		text: 'How many books are in the entire Bible?',
		type: 'numerical',
		numericalAnswer: 66,
		category: 'General',
		difficulty: 'hard'
	},
	{
		id: 'num_08',
		text: 'How many years did Methuselah live?',
		type: 'numerical',
		numericalAnswer: 969,
		category: 'Old Testament',
		difficulty: 'hard'
	},
	{
		id: 'num_09',
		text: 'How many times did Peter deny Jesus?',
		type: 'numerical',
		numericalAnswer: 3,
		category: 'New Testament',
		difficulty: 'easy'
	},
	{
		id: 'num_10',
		text: 'How many days was Jonah in the belly of the fish?',
		type: 'numerical',
		numericalAnswer: 3,
		category: 'Old Testament',
		difficulty: 'easy'
	},
	{
		id: 'num_11',
		text: 'How many stones did David pick up to fight Goliath?',
		type: 'numerical',
		numericalAnswer: 5,
		category: 'Old Testament',
		difficulty: 'medium'
	},
	{
		id: 'num_12',
		text: 'How many pieces of silver did Judas receive for betraying Jesus?',
		type: 'numerical',
		numericalAnswer: 30,
		category: 'New Testament',
		difficulty: 'medium'
	},
	{
		id: 'num_13',
		text: 'How many years did Solomon reign?',
		type: 'numerical',
		numericalAnswer: 40,
		category: 'Old Testament',
		difficulty: 'medium'
	},
	{
		id: 'num_14',
		text: 'How many men did Gideon have in his final army?',
		type: 'numerical',
		numericalAnswer: 300,
		category: 'Old Testament',
		difficulty: 'hard'
	},
	{
		id: 'num_15',
		text: 'How many chapters are in the book of Genesis?',
		type: 'numerical',
		numericalAnswer: 50,
		category: 'General',
		difficulty: 'medium'
	},
	{
		id: 'num_16',
		text: 'How many years was Jesus when he started his ministry?',
		type: 'numerical',
		numericalAnswer: 30,
		category: 'New Testament',
		difficulty: 'easy'
	},
	{
		id: 'num_17',
		text: 'How many loaves fed the 5000?',
		type: 'numerical',
		numericalAnswer: 5,
		category: 'New Testament',
		difficulty: 'easy'
	},
	{
		id: 'num_18',
		text: 'How many books did Paul write?',
		type: 'numerical',
		numericalAnswer: 13,
		category: 'New Testament',
		difficulty: 'hard'
	},
	{
		id: 'num_19',
		text: 'How many years did David reign as king?',
		type: 'numerical',
		numericalAnswer: 40,
		category: 'Old Testament',
		difficulty: 'medium'
	},
	{
		id: 'num_20',
		text: 'How many commandments did God give Moses?',
		type: 'numerical',
		numericalAnswer: 10,
		category: 'Old Testament',
		difficulty: 'easy'
	},

	// TEXT QUESTIONS (20 questions)
	{
		id: 'text_01',
		text: 'What was the name of Moses\' brother who helped him speak to Pharaoh?',
		type: 'text',
		textAnswer: 'Aaron',
		category: 'People',
		difficulty: 'easy'
	},
	{
		id: 'text_02',
		text: 'What was the name of the garden where Adam and Eve lived?',
		type: 'text',
		textAnswer: 'Eden',
		category: 'Places',
		difficulty: 'easy'
	},
	{
		id: 'text_03',
		text: 'What was the name of the giant that David defeated?',
		type: 'text',
		textAnswer: 'Goliath',
		category: 'People',
		difficulty: 'easy'
	},
	{
		id: 'text_04',
		text: 'What was the name of Abraham\'s wife?',
		type: 'text',
		textAnswer: 'Sarah',
		category: 'People',
		difficulty: 'easy'
	},
	{
		id: 'text_05',
		text: 'What was the name of the mountain where Moses received the Ten Commandments?',
		type: 'text',
		textAnswer: 'Sinai',
		category: 'Places',
		difficulty: 'medium'
	},
	{
		id: 'text_06',
		text: 'What was the name of the prophet who was swallowed by a great fish?',
		type: 'text',
		textAnswer: 'Jonah',
		category: 'People',
		difficulty: 'easy'
	},
	{
		id: 'text_07',
		text: 'What was the name of the city where Jesus was crucified?',
		type: 'text',
		textAnswer: 'Jerusalem',
		category: 'Places',
		difficulty: 'easy'
	},
	{
		id: 'text_08',
		text: 'What was the name of the tax collector who climbed a tree to see Jesus?',
		type: 'text',
		textAnswer: 'Zacchaeus',
		category: 'People',
		difficulty: 'medium'
	},
	{
		id: 'text_09',
		text: 'What was the name of the woman who hid the spies in Jericho?',
		type: 'text',
		textAnswer: 'Rahab',
		category: 'People',
		difficulty: 'medium'
	},
	{
		id: 'text_10',
		text: 'What was the name of King David\'s son who rebelled against him?',
		type: 'text',
		textAnswer: 'Absalom',
		category: 'People',
		difficulty: 'medium'
	},
	{
		id: 'text_11',
		text: 'What was the name of the island where John wrote Revelation?',
		type: 'text',
		textAnswer: 'Patmos',
		category: 'Places',
		difficulty: 'hard'
	},
	{
		id: 'text_12',
		text: 'What was the name of the centurion whose servant Jesus healed?',
		type: 'text',
		textAnswer: 'Cornelius',
		category: 'People',
		difficulty: 'hard'
	},
	{
		id: 'text_13',
		text: 'What was the name of the priest who raised Samuel?',
		type: 'text',
		textAnswer: 'Eli',
		category: 'People',
		difficulty: 'medium'
	},
	{
		id: 'text_14',
		text: 'What was the name of the well where Jesus met the Samaritan woman?',
		type: 'text',
		textAnswer: 'Jacob\'s well',
		category: 'Places',
		difficulty: 'hard'
	},
	{
		id: 'text_15',
		text: 'What was the name of the king who threw Daniel into the lions\' den?',
		type: 'text',
		textAnswer: 'Darius',
		category: 'People',
		difficulty: 'medium'
	},
	{
		id: 'text_16',
		text: 'What was the name of Ruth\'s mother-in-law?',
		type: 'text',
		textAnswer: 'Naomi',
		category: 'People',
		difficulty: 'medium'
	},
	{
		id: 'text_17',
		text: 'What was the name of the river where Jesus was baptized?',
		type: 'text',
		textAnswer: 'Jordan',
		category: 'Places',
		difficulty: 'easy'
	},
	{
		id: 'text_18',
		text: 'What was the name of the disciple who walked on water with Jesus?',
		type: 'text',
		textAnswer: 'Peter',
		category: 'People',
		difficulty: 'easy'
	},
	{
		id: 'text_19',
		text: 'What was the name of the prophet who succeeded Elijah?',
		type: 'text',
		textAnswer: 'Elisha',
		category: 'People',
		difficulty: 'medium'
	},
	{
		id: 'text_20',
		text: 'What was the name of the woman who became queen to save the Jews from Haman?',
		type: 'text',
		textAnswer: 'Esther',
		category: 'People',
		difficulty: 'easy'
	}
];

// Helper functions to get questions by type or category
export function getQuestionsByType(type: Question['type']): Question[] {
	return questions.filter(q => q.type === type);
}

export function getQuestionsByCategory(category: Question['category']): Question[] {
	return questions.filter(q => q.category === category);
}

export function getQuestionsByDifficulty(difficulty: Question['difficulty']): Question[] {
	return questions.filter(q => q.difficulty === difficulty);
}

export function getRandomQuestion(): Question {
	return questions[Math.floor(Math.random() * questions.length)];
}

export function getRandomQuestionByType(type: Question['type']): Question {
	const filtered = getQuestionsByType(type);
	return filtered[Math.floor(Math.random() * filtered.length)];
}

export function getRandomQuestionByDifficulty(difficulty: Question['difficulty']): Question {
	const filtered = getQuestionsByDifficulty(difficulty);
	return filtered[Math.floor(Math.random() * filtered.length)];
}