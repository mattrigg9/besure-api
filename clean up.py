import json
from pprint import pprint
import re

def clean_up_data(dic):
	old_entry = dic['features'][0]
	new_entry = {}
	#new_entry['name'] = re.sub(r"\\u(....)", r"\1", old_entry['properties']['name'])
	new_entry['name'] = old_entry['properties']['name'].encode('utf-8').decode('ascii','ignore')
	new_entry['description'] = old_entry['properties']['name']
	return new_entry

with open('/Users/mattrigg/Desktop/places.json') as data_file:
	data = json.load(data_file)

new_data = clean_up_data(data)
pprint(new_data)