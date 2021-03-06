import 'ui/field_editor';
import { IndexPatternsFieldProvider } from 'ui/index_patterns/_field';
import UrlProvider from 'ui/url';
import uiRoutes from 'ui/routes';
import template from './scripted_field_editor.html';

// kibi: change '/management/kibana/indices/:' and '/management\/kibana\/indices\/[^\/]'
// to '/management/siren/indices/:' and '/management\/siren\/indices\/[^\/]'
uiRoutes
.when('/management/siren/indices/:indexPatternId/field/:fieldName*', { mode: 'edit' })
.when('/management/siren/indices/:indexPatternId/create-field/', { mode: 'create' })
.defaults(/management\/siren\/indices\/[^\/]+\/(field|create-field)(\/|$)/, {
  template,
  mapBreadcrumbs($route, breadcrumbs) {
    const { indexPattern } = $route.current.locals;
    return breadcrumbs.map(crumb => {
      if (crumb.id !== indexPattern.id) {
        return crumb;
      }

      return {
        ...crumb,
        display: indexPattern.title
      };
    });
  },
  resolve: {
    indexPattern: function ($route, courier) {
      return courier.indexPatterns.get($route.current.params.indexPatternId)
      .catch(courier.redirectWhenMissing('/management/siren/indices'));
    }
  },
  controllerAs: 'fieldSettings',
  controller: function FieldEditorPageController($route, Private, createNotifier, docTitle) {
    const Field = Private(IndexPatternsFieldProvider);
    const notify = createNotifier({ location: 'Field Editor' });
    const kbnUrl = Private(UrlProvider);

    this.mode = $route.current.mode;
    this.indexPattern = $route.current.locals.indexPattern;


    if (this.mode === 'edit') {
      const fieldName = $route.current.params.fieldName;
      this.field = this.indexPattern.fields.byName[fieldName];

      if (!this.field) {
        notify.error(this.indexPattern + ' does not have a "' + fieldName + '" field.');
        kbnUrl.redirectToRoute(this.indexPattern, 'edit');
        return;
      }

    }
    else if (this.mode === 'create') {
      this.field = new Field(this.indexPattern, {
        scripted: true,
        type: 'number'
      });
    }
    else {
      throw new Error('unknown fieldSettings mode ' + this.mode);
    }

    docTitle.change([this.field.name || 'New Scripted Field', this.indexPattern.title]);
    this.goBack = function () {
      kbnUrl.changeToRoute(this.indexPattern, 'edit');
    };
  }
});
