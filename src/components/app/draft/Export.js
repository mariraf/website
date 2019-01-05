import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import TrayFooter from "../../TrayFooter";
import Button from "@material-ui/core/Button";
import { FormattedMessage } from "react-intl";
import fileSaver from "file-saver";
import YAML from "yaml";
import {
  showNotification,
  closeNotification
} from "../../../store/actions/notification";
import i18nPlugin from "@freesewing/plugin-i18n";
import themePlugin from "@freesewing/plugin-theme";
import svgattrPlugin from "@freesewing/plugin-svgattr";
import { plugin as patternTranslations } from "@freesewing/i18n";
import { patterns } from "@freesewing/patterns";
import { capitalize } from "../../../utils";
import prism from "prismjs";
import Center from "../../Center";
import Spinner from "../../Spinner";
import backend from "../../../backend";
import BecomeAPatron from "../../patrons/BecomeAPatron";
import HeartIcon from "@material-ui/icons/Favorite";

class Export extends React.Component {
  state = {
    loading: true,
    svg: false,
    link: false
  };

  svgToClipboard = svg => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(document.getElementById("svg"));
    selection.removeAllRanges();
    selection.addRange(range);
    try {
      document.execCommand("copy");
      selection.removeAllRanges();
      this.props.showNotification(
        "success",
        <FormattedMessage id="app.copiedToClipboard" />
      );
    } catch (err) {
      console.log("error", err);
      this.props.showNotification("error", err);
    }
  };

  svgToFile = svg => {
    const blob = new Blob([svg], {
      type: "image/svg+xml;charset=utf-8"
    });
    fileSaver.saveAs(blob, "draft.svg");
  };

  svgToPdf(svg, format) {
    let size = "full";
    if (format !== "PDF") size = format.toLowerCase();
    backend
      .tiler(svg, format, size)
      .then(res => {
        if (res.status === 200) {
          this.setState({ link: res.data.link });
          this.props.showNotification("success", "PDF Generated");
        }
      })
      .catch(err => {
        console.log("nope", err);
        this.props.showNotification("error", err);
        return false;
      });
  }

  renderDraft = (withTheme = false) => {
    const pattern = new patterns[(capitalize(this.props.gist.pattern))](
      this.props.gist.settings
    )
      .use(i18nPlugin, { strings: patternTranslations })
      .use(svgattrPlugin, { class: "freesewing draft" });
    if (withTheme) pattern.use(themePlugin);
    try {
      pattern.draft();
    } catch (err) {
      console.log(err, pattern);
      this.state.error = err;
    }
    return pattern.render();
  };

  render() {
    if (this.props.format === "SVG") {
      let svg = this.renderDraft();
      return (
        <div className="gist">
          <div className="gist-header">
            <Button color="secondary" onClick={() => this.svgToClipboard(svg)}>
              <FormattedMessage id="app.copy" />
            </Button>
            <Button
              color="secondary"
              onClick={() => this.svgToFile(this.renderDraft(true))}
            >
              <FormattedMessage id="app.save" />
            </Button>
            <div className="filename">
              draft.
              {this.props.format.toLowerCase()}
            </div>
          </div>
          <div
            className="code"
            dangerouslySetInnerHTML={{
              __html: prism.highlight(svg, prism.languages.svg, "svg")
            }}
          />
          <div className="hidden" id="svg">
            {svg}
          </div>
        </div>
      );
    } else {
      if (this.state.link === false) {
        this.svgToPdf(this.renderDraft(), this.props.format);
        return (
          <Center>
            <Spinner size={200} />
          </Center>
        );
      } else {
        let html = [
          <div className="txt-center">
            <h2>Your PDF is ready</h2>
            <Button
              color="primary"
              variant="contained"
              size="large"
              href={this.state.link}
            >
              Download PDF
            </Button>
          </div>
        ];
        if (
          typeof this.props.user.patron === "undefined" ||
          this.props.user.patron < 20
        )
          html.push(
            <div>
              <blockquote>
                <h5>
                  <FormattedMessage id="app.becomeAPatron" />
                </h5>
                <p>
                  <FormattedMessage id="app.patronsKeepUsAfloat" />
                </p>
                <p>
                  <FormattedMessage id="app.patronPitch" />
                </p>
              </blockquote>
              <BecomeAPatron language={this.props.language} />
            </div>
          );
        return <div>{html}</div>;
      }
    }
  }
}

Export.propTypes = {
  gist: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  user: state.user
});
const mapDispatchToProps = dispatch => ({
  showNotification: (style, message) =>
    dispatch(showNotification(style, message)),
  closeNotification: () => dispatch(closeNotification())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Export);