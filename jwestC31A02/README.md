Author: Jonathan West

Additional functionality not listed in the assignment:

- When accessing a numeric field from cars, you can add an additional path specifying whether the results should be.
  These are henceforth referred to as comparers.
	* Less than the field's value (/l)
	* Less than or equal to (/le)
	* exactly equal to (/e)
	* greater than or equal to (/ge)
	* greater than (/g)
	Example: localhost:9000/cars/year/1998/le

- You can easily add functionality to read more json or xml files from the data folder by modifying adding the filled
  version of the following template right after the requires in the beginning of the app.js file:
  * For .json files:
		JSONSRCH.fields("filename", {
			numeric: {
				numericPropertyName1: "default_comparer",
				numericPropertyName2: "default_comparer",
			},
			std: ["propertyName1", "propertyName2"] //std = standard property name
		});
  * For .xml files:
		SRCH.terms("filename",
			["searchableTagName1", "searchableTagName2"], //Leave [] or undefined if there should be no searchable tags
			["searchableAttrName1", "searchableAttrName2"] //This is optional
		);
		
DISCLAIMER: The additional files must be stored in the data folder
			Additional .xml files must have an mst template created for them, otherwise you will only recieve an error
			.json files will display all of the matching object's properties
			
- If the appropriate form, template, and parsing module are made for POST methods, they will work.
  The parsing module must export a create method that accepts an object argument and returns an object.
  The object passed into create() should pass its properties to the returned object.
- Here is the form template:

	<form method="post">
		<p>
			<label for="firstName">First Name: </label>
			<input id="firstName" name="firstName" type="text"/>
		</p> <!-- repeat as necessary /-->
		<input type="submit" value="Create"/>
		<input type="hidden" name="module" value="The name of the module that parses the sent object"/>
		<input type="hidden" name="temp" value="template.mst"/>
		<input type="hidden" name="save" value="saveFile.txt"/>
	</form>