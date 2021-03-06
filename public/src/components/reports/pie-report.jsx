import React, { Component } from 'react';
import PieChart from './charts/pie-chart.jsx';
import axios from 'axios';
import _ from 'lodash';
import { filterToCurrentWeek } from './report-helpers.js';
import './report.css';
const debug = process.env.DEBUG || false;

const typeMap = {
  Meal: {type: 'Meal', field: 'ingredients'},
  PulseEmo: {type: 'Pulse', field: 'emotionalTags'},
  PulsePhys: {type: 'Pulse', field: 'physicalTags'},
};

export default class PieReport extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [ ]
    };
    this.entryType = typeMap[this.props.type].type;
    this.field = typeMap[this.props.type].field;
    this.updateData = this.updateData.bind(this);
  }

  componentDidMount() { this.updateData(); }

  updateData() {
    axios.get('/api/entries', {
      params: {
        type: this.entryType,
        limit: 30,
      },
      headers: {'Authorization': 'bearer ' + this.props.auth()}
    }).then(res => {
      this.filterData(res.data);
    });
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.lastFormSubmitted !== nextProps.lastFormSubmitted &&
        this.props.type === nextProps.lastFormSubmitted.name) {
      this.updateData();
    }
  }

  filterData(entries) {
    entries = filterToCurrentWeek(entries);
    var tags = _.filter(entries, (entry) => {
      return entry[this.field].length !== 0;
    });

    tags = _.flatMap(tags, (entry) => {
      return entry[this.field];
    });

    tags = _.reduce(tags, (allTags, tag) => {
      if (tag in allTags) {
        allTags[tag]++;
      } else {
        allTags[tag] = 1;
      }
      return allTags;
    }, {});

    tags = _.toPairs(tags);

    tags = _.sortBy(tags, (i) => -i[1]);

    var labels = _.map(tags, (i) => i[0]).slice(0, 5);
    var values = _.map(tags, (i) => i[1]).slice(0, 5);
    var data = {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#8CB369',
          '#5B5F97',
          '#60afff',
          '#f6ae2d',
          '#f26419'
        ]
      }],
    };
    if (debug) { console.log(tags, labels, values); }
    if (debug) { console.log(data); }
    this.setState({data: data});
  }

  render() {
    return (
      <div className="report-container">
        <div className="report-header">{this.props.title}</div>
        <div className="report-content">
          <PieChart data={this.state.data} id={`pie-chart-${this.entryType.toLowerCase()}`}/>
        </div>
      </div>
    );
  }
}
